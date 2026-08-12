# Encrypted image attachments

Attachments are encrypted on the client before upload. The server stores only AES-GCM ciphertext and an IV; it never receives the note key, image bytes, filename, or MIME type.

## Upload protocol

1. Use the note key (the same Base64 key placed in the shared URL fragment) with `encryptAttachment` from `webapp/src/lib/crypto/attachments.ts`.
   It derives an attachment AES-256-GCM key via HKDF-SHA-256 and encrypts each file with a new random 96-bit IV.
2. Send the encrypted payload:

```http
POST /api/note/{noteId}/attachment
Content-Type: application/json

{
  "ciphertext": "<Base64 AES-GCM ciphertext>",
  "iv": "<Base64 12-byte IV>",
  "secret_token": "<token returned while creating the note>"
}
```

The response is `201` with a random, URL-safe 256-bit `attachment_id`. Uploads are limited to 5 MiB of ciphertext.

3. Put the image reference into the encrypted Markdown payload:

```md
![Alt text](attachment:<attachment_id> "image/png")
```

The optional title is the MIME type. It is inside the encrypted note, so the server does not learn it. The webapp loads the ciphertext from `GET /api/note/attachment/{attachment_id}`, decrypts it in memory, and renders a blob URL.

## Lifecycle and access

- Attachment IDs are 256-bit random values, so they cannot be feasibly enumerated.
- A GET endpoint is intentionally public, but returns ciphertext only. The URL fragment key never reaches the server.
- An attachment is unavailable after its parent note expires.
- Deleting or expiring a note removes its attachments through the database foreign-key cascade.
