import express from "express";
import rateLimit from "express-rate-limit";
import {
  getAttachmentController,
  postAttachmentController,
} from "./note.attachment.controller";
import { deleteNoteController } from "./note.delete.controller";
import { getNoteController } from "./note.get.controller";
import { postNoteController } from "./note.post.controller";

export const notesRoute = express.Router();

const noteJsonParser = express.json({ limit: "500k" });
const attachmentJsonParser = express.json({ limit: "7mb" });

const postRateLimit = rateLimit({
  windowMs: parseFloat(process.env.POST_LIMIT_WINDOW_SECONDS as string) * 1000,
  max: parseInt(process.env.POST_LIMIT as string), // Limit each IP to X requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const getRateLimit = rateLimit({
  windowMs: parseFloat(process.env.GET_LIMIT_WINDOW_SECONDS as string) * 1000,
  max: parseInt(process.env.GET_LIMIT as string), // Limit each IP to X requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

notesRoute.post("", noteJsonParser, postRateLimit, postNoteController);
notesRoute.post(
  "/:noteId/attachment",
  attachmentJsonParser,
  postRateLimit,
  postAttachmentController
);
notesRoute.get("/attachment/:id", getRateLimit, getAttachmentController);
notesRoute.get("/:id", getRateLimit, getNoteController);
notesRoute.delete("/:id", noteJsonParser, getRateLimit, deleteNoteController);
