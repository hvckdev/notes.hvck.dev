CREATE TABLE "EncryptedAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "note_id" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "insert_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EncryptedAttachment_note_id_fkey"
        FOREIGN KEY ("note_id") REFERENCES "EncryptedNote" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "EncryptedAttachment_note_id_idx" ON "EncryptedAttachment"("note_id");
