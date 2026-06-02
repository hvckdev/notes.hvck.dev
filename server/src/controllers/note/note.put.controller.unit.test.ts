import { EncryptedNote } from "@prisma/client";
import express from "express";
import supertest from "supertest";
import { vi, describe, it, beforeEach, afterEach, expect } from "vitest";
import * as noteDao from "../../db/note.dao";
import * as bloomFilter from "../../db/bloomFilter.dao";
import EventLogger from "../../logging/EventLogger";
import { putNoteController } from "./note.put.controller";

vi.mock("../../db/note.dao", () => ({
  getNote: vi.fn(),
  updateNote: vi.fn(),
}));
vi.mock("../../db/bloomFilter.dao", () => ({
  getFilter: vi.fn(),
}));
vi.mock("../../logging/EventLogger");

const VALID_USER_ID = "f06536e7df6857fc";
const VALID_CIPHERTEXT = Buffer.from("updated_ciphertext").toString("base64");
const VALID_HMAC = Buffer.from("updated_hmac").toString("base64");
const MOCK_SECRET_TOKEN = "U0VDUkVUX1RPS0VO";
const MOCK_NOTE_ID = "NOTE_ID";

describe("note.put.controller", () => {
  let mockNoteDao = vi.mocked(noteDao);
  let mockEventLogger = vi.mocked(EventLogger);
  let mockBloomFilterDao = vi.mocked(bloomFilter);

  const test_app = express().use(express.json()).put("/:id", putNoteController);

  beforeEach(() => {
    mockNoteDao.getNote.mockImplementation(async (noteId) => {
      if (noteId === MOCK_NOTE_ID) {
        return {
          id: MOCK_NOTE_ID,
          secret_token: MOCK_SECRET_TOKEN,
          ciphertext: Buffer.from("old_ciphertext").toString("base64"),
          hmac: Buffer.from("old_hmac").toString("base64"),
          iv: null,
          crypto_version: "v1",
        } as EncryptedNote;
      } else {
        return null;
      }
    });

    mockNoteDao.updateNote.mockImplementation(async (id, data) => {
      return {
        id,
        ...data,
        insert_time: new Date(),
        expire_time: new Date(),
        secret_token: MOCK_SECRET_TOKEN,
      } as EncryptedNote;
    });

    mockBloomFilterDao.getFilter.mockImplementation(async () => {
      throw new Error("No BloomFilter found");
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("Should update a note with a valid secret token", async () => {
    const response = await supertest(test_app)
      .put(`/${MOCK_NOTE_ID}`)
      .send({
        user_id: VALID_USER_ID,
        secret_token: MOCK_SECRET_TOKEN,
        ciphertext: VALID_CIPHERTEXT,
        hmac: VALID_HMAC,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("view_url");
    expect(response.body).toHaveProperty("expire_time");
    expect(response.body).toHaveProperty("note_id", MOCK_NOTE_ID);
    expect(mockNoteDao.updateNote).toBeCalledWith(
      MOCK_NOTE_ID,
      expect.objectContaining({
        ciphertext: VALID_CIPHERTEXT,
        hmac: VALID_HMAC,
      })
    );
    expect(mockEventLogger.updateEvent).toBeCalledWith(
      expect.objectContaining({
        note_id: MOCK_NOTE_ID,
        user_id: VALID_USER_ID,
        success: true,
      })
    );
  });

  it("Should return 401 for an invalid secret token", async () => {
    const response = await supertest(test_app)
      .put(`/${MOCK_NOTE_ID}`)
      .send({
        user_id: VALID_USER_ID,
        secret_token: "0000",
        ciphertext: VALID_CIPHERTEXT,
        hmac: VALID_HMAC,
      });

    expect(response.status).toBe(401);
    expect(mockNoteDao.updateNote).not.toBeCalled();
    expect(mockEventLogger.updateEvent).toBeCalledWith(
      expect.objectContaining({
        user_id: VALID_USER_ID,
        success: false,
      })
    );
  });

  it("Should return 404 for a note that does not exist", async () => {
    const response = await supertest(test_app)
      .put("/0000")
      .send({
        user_id: VALID_USER_ID,
        secret_token: MOCK_SECRET_TOKEN,
        ciphertext: VALID_CIPHERTEXT,
        hmac: VALID_HMAC,
      });

    expect(response.status).toBe(404);
    expect(mockNoteDao.updateNote).not.toBeCalled();
    expect(mockEventLogger.updateEvent).toBeCalledWith(
      expect.objectContaining({
        user_id: VALID_USER_ID,
        success: false,
      })
    );
  });

  it("Should return 400 for invalid body (missing ciphertext)", async () => {
    const response = await supertest(test_app)
      .put(`/${MOCK_NOTE_ID}`)
      .send({
        user_id: VALID_USER_ID,
        secret_token: MOCK_SECRET_TOKEN,
        hmac: VALID_HMAC,
      });

    expect(response.status).toBe(400);
    expect(mockNoteDao.updateNote).not.toBeCalled();
  });

  it("Should update a note with iv instead of hmac (crypto v3)", async () => {
    const VALID_IV = Buffer.from("updated_iv").toString("base64");

    const response = await supertest(test_app)
      .put(`/${MOCK_NOTE_ID}`)
      .send({
        user_id: VALID_USER_ID,
        secret_token: MOCK_SECRET_TOKEN,
        ciphertext: VALID_CIPHERTEXT,
        iv: VALID_IV,
        crypto_version: "v3",
      });

    expect(response.status).toBe(200);
    expect(mockNoteDao.updateNote).toBeCalledWith(
      MOCK_NOTE_ID,
      expect.objectContaining({
        ciphertext: VALID_CIPHERTEXT,
        iv: VALID_IV,
        crypto_version: "v3",
      })
    );
  });

  it("Should return 400 for malformed user ID", async () => {
    const response = await supertest(test_app)
      .put(`/${MOCK_NOTE_ID}`)
      .send({
        user_id: "invalid",
        secret_token: MOCK_SECRET_TOKEN,
        ciphertext: VALID_CIPHERTEXT,
        hmac: VALID_HMAC,
      });

    expect(response.status).toBe(400);
    expect(mockNoteDao.updateNote).not.toBeCalled();
  });
});
