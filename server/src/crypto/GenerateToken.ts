import crypto from "node:crypto";

const TOKEN_BYTES = 32;

/**
 * Generates a 256 bit token using the nodeJS crypto module.
 * @returns base 64-encoded token.
 */
export function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64");
}

/** Generates a URL-safe, 256-bit identifier for encrypted attachments. */
export function generateAttachmentId(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("base64");
}

function timingSafeStringEqual(actualValue: string, expectedValue: string, encoding: BufferEncoding): boolean {
  const actual = new Uint8Array(Buffer.from(actualValue, encoding));
  const expected = new Uint8Array(Buffer.from(expectedValue, encoding));
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function verifyToken(token: string, expectedTokenHash?: string | null, legacyToken?: string | null): boolean {
  if (expectedTokenHash) {
    return timingSafeStringEqual(hashToken(token), expectedTokenHash, "base64");
  }

  if (!legacyToken) {
    return false;
  }

  return timingSafeStringEqual(token, legacyToken, "utf8");
}
