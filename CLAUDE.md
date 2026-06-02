# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**notes.hvck.dev** is a fork of Noteshare.space — a service for sharing end-to-end encrypted Markdown notes from Obsidian. Notes are encrypted client-side (AES), stored temporarily on the server as ciphertext, and decrypted in the browser using a key passed via URL fragment (never sent to the server).

## Monorepo Structure

Three subpackages, each with its own `package.json` and build tooling. Run `npm install` in every subproject and the root.

- **`server/`** — Express + Prisma + SQLite backend. Handles note CRUD, rate limiting, periodic cleanup of expired notes.
- **`webapp/`** — SvelteKit frontend. Server-side loads encrypted note, client-side decrypts and renders Obsidian-flavored Markdown.
- **`plugin/`** — Obsidian plugin (git submodule, currently not checked out; develop at mcndt/obsidian-quickshare).

## Development Commands

```bash
# Full-stack dev (all subprojects + reverse proxy at localhost:5000)
npm run dev

# Server only
cd server
npm run dev          # Nodemon with pino-colada
npm run build        # tsc compilation
npm run test         # Vitest (resets test DB first)
npm run test-watch   # Vitest watch mode
npm run migrate      # prisma migrate dev

# Webapp only
cd webapp
npm run dev          # Vite dev server (port 5173)
npm run build        # SvelteKit build (adapter-node)
npm run check        # svelte-check type checking
npm run lint         # Prettier check + ESLint
npm run format       # Prettier write
npm run test         # Vitest
```

Before storing notes locally, migrate the database: `cd server && npx prisma migrate deploy`

## Architecture

### Data Flow

1. Obsidian plugin encrypts note (AES) → POSTs ciphertext + HMAC/IV to `/api/note`
2. Server stores in SQLite, returns note ID + secret_token
3. Share URL: `https://notes.hvck.dev/note/{id}#key` (key in URL fragment, never reaches server)
4. SvelteKit server load fetches encrypted note from backend API
5. Client decrypts with key from URL hash, renders Markdown

### Server (`server/src/`)

- **controllers/note/** — Express route handlers: POST (create), GET (read), DELETE (with secret_token auth)
- **db/** — Prisma client + DAOs (note.dao.ts, bloomFilter.dao.ts)
- **crypto/** — 256-bit random token generation
- **lib/** — Bloom filter for expired/deleted note tracking, CRC16 userId check
- **logging/** — Pino logger + EventLogger (CRUD + purge events to DB)
- **tasks/** — Periodic `deleteExpiredNotes` cleanup
- **validation/** — class-validator DTOs for request bodies

Bloom filters are a probabilistic optimization to distinguish 410 (expired/deleted) from 404 (not found) without querying the DB.

### Webapp (`webapp/src/`)

- **routes/note/[id]/** — Server load fetches encrypted note; client-side decrypts + renders
- **lib/crypto/decrypt.ts** — Three crypto versions: v1 (CryptoJS AES-CBC+HMAC), v2 (WebCrypto AES-CBC+HMAC), v3 (WebCrypto AES-GCM)
- **lib/marked/** — Custom marked.js extensions + Svelte renderers for Obsidian Markdown: wikilinks, embeds, tags, highlights, math (KaTeX/MathJax), footnotes, callouts
- **lib/components/** — Svelte components (MarkdownRenderer, Callout, NavBar, Footer, etc.)

### Database (Prisma/SQLite)

- **EncryptedNote**: id (cuid), insert_time, expire_time, ciphertext, hmac?, iv?, crypto_version, secret_token?
- **event**: audit log (WRITE/READ/DELETE/UPDATE/PURGE)
- **BloomFilter**: serialized Bloom filters tracking expired/deleted note IDs

## Code Style

- **Prettier**: useTabs, singleQuote, trailingComma: none, printWidth: 100
- **ESLint**: eslint:recommended + @typescript-eslint/recommended + prettier
- **TypeScript**: strict mode in both server and webapp; server uses `experimentalDecorators` for class-validator
- **Styling**: Tailwind CSS with `@tailwindcss/typography`, dark mode via class strategy

## Environment Variables

See `.env.example` in each subdirectory. Key ones:

**Server**: `DATABASE_URL` (SQLite path), `FRONTEND_URL`, `PORT`, `CLEANUP_INTERVAL_SECONDS`, rate limit vars, `LOG_LEVEL`

**Webapp**: `VITE_SERVER_INTERNAL` (backend URL), `VITE_BRANDING` (navbar text)

## Production / Docker

`docker-compose.yml` runs: Traefik reverse proxy (port 5000) → backend (8080) + frontend (3000). Separate migration container runs `prisma migrate deploy`. Named volumes for SQLite persistence and Grafana. Build args pass `VITE_SERVER_INTERNAL` and `VITE_BRANDING`.
