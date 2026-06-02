import { NextFunction, Request, Response } from "express";
import { getNote, updateNote } from "../../db/note.dao";
import checkId from "../../lib/checkUserId";
import { getNoteFilter } from "../../lib/expiredNoteFilter";
import EventLogger, { UpdateEvent } from "../../logging/EventLogger";
import { getConnectingIp, getNoteSize } from "../../util";
import { validateOrReject, ValidationError } from "class-validator";
import { NoteUpdateRequest } from "../../validation/Request";

export async function putNoteController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const event: UpdateEvent = {
    success: false,
    host: getConnectingIp(req),
    user_id: req.body.user_id,
    user_plugin_version: req.body.plugin_version,
  };

  // Validate request body
  const noteUpdateRequest = new NoteUpdateRequest();
  Object.assign(noteUpdateRequest, req.body);
  try {
    await validateOrReject(noteUpdateRequest);
  } catch (_err: any) {
    const err = _err as ValidationError;
    res.status(400).send(err.toString());
    event.error = err.toString();
    await EventLogger.updateEvent(event);
    return;
  }

  // Validate user ID, if present
  if (noteUpdateRequest.user_id && !checkId(noteUpdateRequest.user_id)) {
    console.log("invalid user id");
    res.status(400).send("Invalid user id (checksum failed)");
    event.error = "Invalid user id (checksum failed)";
    EventLogger.updateEvent(event);
    return;
  }

  // Get note from db
  const note = await getNote(req.params.id);
  if (!note) {
    // check the expired/deleted filters
    try {
      const deletedFilter = await getNoteFilter("deletedNotes");
      const expiredFilter = await getNoteFilter("expiredNotes");

      if (deletedFilter.hasNoteId(req.params.id)) {
        res.status(410).send("Note deleted");
        event.error = "Note deleted";
      } else if (expiredFilter.hasNoteId(req.params.id)) {
        res.status(410).send("Note expired");
        event.error = "Note expired";
      } else {
        res.status(404).send("Note not found");
        event.error = "Note not found";
      }
    } catch {
      res.status(404).send("Note not found");
      event.error = "Note not found";
    }
    await EventLogger.updateEvent(event);
    return;
  }

  // Validate secret token
  if (note.secret_token !== req.body.secret_token) {
    res.status(401).send("Invalid token");
    event.error = "Invalid secret token";
    await EventLogger.updateEvent(event);
    return;
  }

  // Update note
  try {
    const updatedNote = await updateNote(note.id, {
      ciphertext: noteUpdateRequest.ciphertext as string,
      hmac: noteUpdateRequest.hmac as string,
      iv: noteUpdateRequest.iv as string,
      crypto_version: noteUpdateRequest.crypto_version,
    });

    event.success = true;
    event.note_id = updatedNote.id;
    event.size_bytes = getNoteSize(updatedNote);
    await EventLogger.updateEvent(event);

    res.json({
      view_url: `${process.env.FRONTEND_URL}/note/${updatedNote.id}`,
      expire_time: updatedNote.expire_time,
      note_id: updatedNote.id,
    });
  } catch (err) {
    event.error = (err as Error).toString();
    await EventLogger.updateEvent(event);
    next(err);
  }
}
