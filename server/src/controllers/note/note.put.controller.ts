import { validateOrReject, ValidationError } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../../crypto/GenerateToken";
import { getNote, updateNotePayload } from "../../db/note.dao";
import { NotePutRequest } from "../../validation/Request";

/**
 * Replaces a draft note's encrypted AES-GCM payload after its attachments have
 * been uploaded. The request is intentionally not logged because it contains
 * ciphertext.
 */
export async function putNoteController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const payload = new NotePutRequest();
  Object.assign(payload, req.body);

  try {
    await validateOrReject(payload);
  } catch (_err: unknown) {
    const err = _err as ValidationError;
    res.status(400).send(err.toString());
    return;
  }

  try {
    const note = await getNote(req.params.noteId);
    if (!note) {
      res.status(404).send("Note not found");
      return;
    }

    if (!verifyToken(payload.secret_token!, note.secret_token_hash, note.secret_token)) {
      res.status(401).send("Invalid token");
      return;
    }

    const updatedNote = await updateNotePayload(note.id, {
      ciphertext: payload.ciphertext!,
      iv: payload.iv!,
      crypto_version: payload.crypto_version,
    });

    res.status(200).json({
      note_id: updatedNote.id,
      view_url: `${process.env.FRONTEND_URL}/note/${updatedNote.id}`,
      expire_time: updatedNote.expire_time,
    });
  } catch (err) {
    next(err);
  }
}
