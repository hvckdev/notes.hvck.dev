import { validateOrReject, ValidationError } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { generateAttachmentId, verifyToken } from "../../crypto/GenerateToken";
import { prisma } from "../../db/client";
import { getNote } from "../../db/note.dao";
import { AttachmentPostRequest } from "../../validation/Request";

const MAX_ATTACHMENT_CIPHERTEXT_BYTES = 5 * 1024 * 1024;

export async function postAttachmentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const payload = new AttachmentPostRequest();
  Object.assign(payload, req.body);

  try {
    await validateOrReject(payload);
  } catch (_err: unknown) {
    const err = _err as ValidationError;
    res.status(400).send(err.toString());
    return;
  }

  if (Buffer.from(payload.ciphertext!, "base64").length > MAX_ATTACHMENT_CIPHERTEXT_BYTES) {
    res.status(413).send("Attachment exceeds the 5 MB limit");
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

    const attachment = await prisma.encryptedAttachment.create({
      data: {
        id: generateAttachmentId(),
        note_id: note.id,
        ciphertext: payload.ciphertext!,
        iv: payload.iv!,
      },
    });

    res.status(201).json({ attachment_id: attachment.id });
  } catch (err) {
    next(err);
  }
}

export async function getAttachmentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const attachment = await prisma.encryptedAttachment.findUnique({
      where: { id: req.params.id },
      select: {
        ciphertext: true,
        iv: true,
        note: { select: { expire_time: true } },
      },
    });

    if (!attachment || attachment.note.expire_time <= new Date()) {
      res.status(404).send("Attachment not found");
      return;
    }

    res.set("Cache-Control", "public, max-age=2592000, immutable");
    res.json({ ciphertext: attachment.ciphertext, iv: attachment.iv });
  } catch (err) {
    next(err);
  }
}
