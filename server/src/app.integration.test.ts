import { app } from "./app";
import supertest from "supertest";
import { describe, it, expect } from "vitest";
import { prisma } from "./db/client";
import { deleteExpiredNotes } from "./tasks/deleteExpiredNotes";
import { EventType } from "./logging/EventLogger";

// const testNote with base64 ciphertext and hmac
const testNote = {
  ciphertext: Buffer.from("sample_ciphertext").toString("base64"),
  hmac: Buffer.from("sample_hmac").toString("base64"),
};

describe("GET /api/note", () => {
  it("returns a note for valid ID", async () => {
    // Insert a note
    const { id } = await prisma.encryptedNote.create({
      data: testNote,
    });

    // Make get request
    const res = await supertest(app).get(`/api/note/${id}`);

    // Validate returned note
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("expire_time");
    expect(res.body).toHaveProperty("insert_time");
    expect(res.body).toHaveProperty("ciphertext");
    expect(res.body).toHaveProperty("hmac");
    expect(res.body.id).toEqual(id);
    expect(res.body.ciphertext).toEqual(testNote.ciphertext);
    expect(res.body.hmac).toEqual(testNote.hmac);

    // Is a read event logged?
    const readEvents = await prisma.event.findMany({
      where: { type: EventType.READ, note_id: id },
    });
    expect(readEvents.length).toBe(1);
    expect(readEvents[0].success).toBe(true);
    expect(readEvents[0].size_bytes).toBe(
      res.body.ciphertext.length + res.body.hmac.length
    );
  });

  it("responds 404 for invalid ID", async () => {
    // Make get request
    const res = await supertest(app).get(`/api/note/NaN`);

    // Validate returned note
    expect(res.statusCode).toBe(404);

    // Is a read event logged?
    const readEvents = await prisma.event.findMany({
      where: { type: EventType.READ, note_id: "NaN" },
    });
    expect(readEvents.length).toBe(1);
    expect(readEvents[0].success).toBe(false);
  });

  it("Applies rate limits to endpoint", async () => {
    // Insert a note
    const { id } = await prisma.encryptedNote.create({
      data: testNote,
    });

    // Make get requests
    const requests = [];
    for (let i = 0; i < 51; i++) {
      requests.push(supertest(app).get(`/api/note/${id}`));
    }
    const responses = await Promise.all(requests);
    const responseCodes = responses.map((res) => res.statusCode);

    // at least one response should be 429
    expect(responseCodes).toContain(429);

    // sleep for 100 ms to allow rate limiter to reset
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
});

describe("POST /api/note", () => {
  it("returns a view_url on correct POST body (without plugin version and user id)", async () => {
    const res = await supertest(app).post("/api/note").send(testNote);

    if (res.statusCode !== 200) {
      console.log(res.body);
    }
    expect(res.statusCode).toBe(200);

    // Returned body has correct fields
    expect(res.body).toHaveProperty("expire_time");
    expect(res.body).toHaveProperty("view_url");

    // View URL is properly formed
    expect(res.body.view_url).toMatch(/^http[s]?:\/\//);

    // A future expiry date is assigned
    expect(new Date(res.body.expire_time).getTime()).toBeGreaterThan(
      new Date().getTime()
    );

    // Is a write event logged?
    const writeEvents = await prisma.event.findMany({
      where: { type: EventType.WRITE, note_id: res.body.id },
    });
    expect(writeEvents.length).toBe(1);
    expect(writeEvents[0].success).toBe(true);
    expect(writeEvents[0].expire_window_days).toBe(30);
    expect(writeEvents[0].size_bytes).toBe(
      testNote.ciphertext.length + testNote.hmac.length
    );
  });

  it("deletes a newly created note using its returned secret token", async () => {
    const createResponse = await supertest(app).post("/api/note").send(testNote);

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.body).toMatchObject({
      note_id: expect.any(String),
      secret_token: expect.any(String),
    });

    const deleteResponse = await supertest(app)
      .delete(`/api/note/${createResponse.body.note_id}`)
      .send({ secret_token: createResponse.body.secret_token });

    expect(deleteResponse.statusCode).toBe(200);
    expect(
      await prisma.encryptedNote.findUnique({ where: { id: createResponse.body.note_id } })
    ).toBeNull();
  });

  it("Returns a bad request on invalid POST body", async () => {
    const res = await supertest(app).post("/api/note").send({});
    expect(res.statusCode).toBe(400);
  });

  it("returns a valid view_url on correct POST body", async () => {
    // Make post request
    let res = await supertest(app).post("/api/note").send(testNote);

    // Extract note id from post response
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("view_url");
    const match = (res.body.view_url as string).match(/note\/(.+)$/);
    expect(match).not.toBeNull();
    expect(match).toHaveLength(2);
    const note_id = (match as RegExpMatchArray)[1];

    // Make get request
    res = await supertest(app).get(`/api/note/${note_id}`);

    // Validate returned note
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("expire_time");
    expect(res.body).toHaveProperty("insert_time");
    expect(res.body).toHaveProperty("ciphertext");
    expect(res.body).toHaveProperty("hmac");
    expect(res.body.id).toEqual(note_id);
    expect(res.body.ciphertext).toEqual(testNote.ciphertext);
    expect(res.body.hmac).toEqual(testNote.hmac);
  });

  it("accepts notes larger than the legacy 500 KB limit", async () => {
    const largeNote = {
      ciphertext: "a".repeat(1024 * 1024),
      crypto_version: "v3",
      iv: Buffer.from("012345678901").toString("base64"),
    };
    const res = await supertest(app).post("/api/note").send(largeNote);
    expect(res.statusCode).toBe(200);
  });

  it("rejects notes larger than the configured upload limit", async () => {
    const largeNote = {
      ciphertext: "a".repeat(10 * 1024 * 1024),
      crypto_version: "v3",
      iv: Buffer.from("012345678901").toString("base64"),
    };
    const res = await supertest(app).post("/api/note").send(largeNote);
    expect(res.statusCode).toBe(413);
  });

  it("Applies rate limits to endpoint", async () => {
    // make more requests than the post limit set in .env.test
    const requests = [];
    for (let i = 0; i < 51; i++) {
      requests.push(supertest(app).post("/api/note").send(testNote));
    }
    const responses = await Promise.all(requests);
    const responseCodes = responses.map((res) => res.statusCode);

    // at least one response should be 429
    expect(responseCodes).toContain(200);
    expect(responseCodes).toContain(429);

    // No other response codes should be present
    expect(
      responseCodes.map((code) => code === 429 || code === 200)
    ).not.toContain(false);

    // sleep for 100 ms to allow rate limiter to reset
    await new Promise((resolve) => setTimeout(resolve, 250));
  });
});


describe("PUT /api/note/:noteId", () => {
  const draftPayload = {
    ciphertext: Buffer.from("draft ciphertext").toString("base64"),
    iv: Buffer.from("012345678901").toString("base64"),
    crypto_version: "v3",
  };
  const finalizedPayload = {
    ciphertext: Buffer.from("final ciphertext containing attachment reference").toString("base64"),
    iv: Buffer.from("109876543210").toString("base64"),
    crypto_version: "v3",
  };

  async function createDraft() {
    const response = await supertest(app).post("/api/note").send(draftPayload);
    expect(response.statusCode).toBe(200);
    return response.body as { note_id: string; secret_token: string };
  }

  it("replaces a draft payload and preserves its uploaded attachments", async () => {
    const draft = await createDraft();
    const attachmentPayload = {
      ciphertext: Buffer.from("encrypted image bytes").toString("base64"),
      iv: Buffer.from("abcdefghijkl").toString("base64"),
      secret_token: draft.secret_token,
    };

    const attachmentResponse = await supertest(app)
      .post(`/api/note/${draft.note_id}/attachment`)
      .send(attachmentPayload);
    expect(attachmentResponse.statusCode).toBe(201);

    const updateResponse = await supertest(app)
      .put(`/api/note/${draft.note_id}`)
      .send({ ...finalizedPayload, secret_token: draft.secret_token });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body).toMatchObject({
      note_id: draft.note_id,
      view_url: expect.stringContaining(`/note/${draft.note_id}`),
      expire_time: expect.any(String),
    });
    expect(updateResponse.body).not.toHaveProperty("secret_token");

    const noteResponse = await supertest(app).get(`/api/note/${draft.note_id}`);
    expect(noteResponse.statusCode).toBe(200);
    expect(noteResponse.body).toMatchObject(finalizedPayload);

    const attachmentReadResponse = await supertest(app).get(
      `/api/note/attachment/${attachmentResponse.body.attachment_id}`
    );
    expect(attachmentReadResponse.statusCode).toBe(200);
    expect(attachmentReadResponse.body).toEqual({
      ciphertext: attachmentPayload.ciphertext,
      iv: attachmentPayload.iv,
    });
  });

  it("returns 404 for a note that does not exist", async () => {
    const response = await supertest(app)
      .put("/api/note/nonexistent")
      .send({ ...finalizedPayload, secret_token: Buffer.from("valid token").toString("base64") });

    expect(response.statusCode).toBe(404);
  });

  it("rejects a valid note update with an invalid secret token", async () => {
    const draft = await createDraft();
    const response = await supertest(app).put(`/api/note/${draft.note_id}`).send({
      ...finalizedPayload,
      secret_token: Buffer.from("wrong token").toString("base64"),
    });

    expect(response.statusCode).toBe(401);

    const note = await prisma.encryptedNote.findUnique({ where: { id: draft.note_id } });
    expect(note).toMatchObject(draftPayload);
  });

  it("does not persist or audit non-payload data supplied by a client", async () => {
    const draft = await createDraft();
    const plaintext = "# private plaintext markdown";
    const noteKey = "super-secret-note-key";
    const filename = "private-image.png";
    const mimeType = "image/png";

    const response = await supertest(app).put(`/api/note/${draft.note_id}`).send({
      ...finalizedPayload,
      secret_token: draft.secret_token,
      plaintext,
      note_key: noteKey,
      filename,
      mime_type: mimeType,
    });
    expect(response.statusCode).toBe(200);

    const note = await prisma.encryptedNote.findUnique({ where: { id: draft.note_id } });
    expect(note).toMatchObject(finalizedPayload);
    expect(JSON.stringify(note)).not.toContain(plaintext);
    expect(JSON.stringify(note)).not.toContain(noteKey);
    expect(JSON.stringify(note)).not.toContain(filename);
    expect(JSON.stringify(note)).not.toContain(mimeType);

    const events = await prisma.event.findMany({ where: { note_id: draft.note_id } });
    expect(JSON.stringify(events)).not.toContain(finalizedPayload.ciphertext);
    expect(JSON.stringify(events)).not.toContain(finalizedPayload.iv);
    expect(JSON.stringify(events)).not.toContain(draft.secret_token);
    expect(JSON.stringify(events)).not.toContain(plaintext);
    expect(JSON.stringify(events)).not.toContain(noteKey);
    expect(JSON.stringify(events)).not.toContain(filename);
    expect(JSON.stringify(events)).not.toContain(mimeType);
  });
});

describe("Clean expired notes", () => {
  it("removes expired notes", async () => {
    // insert a note with expiry date in the past using prisma
    const { id } = await prisma.encryptedNote.create({
      data: {
        ...testNote,
        expire_time: new Date(0),
      },
    });

    // make request for note and check that response is 200
    let res = await supertest(app).get(`/api/note/${id}`);
    expect(res.statusCode).toBe(200);

    // run cleanup
    const nDeleted = await deleteExpiredNotes();
    expect(nDeleted).toBeGreaterThan(0);

    // if the note is added to the expire filter, it returns 410
    res = await supertest(app).get(`/api/note/${id}`);
    expect(res.statusCode).toBe(410);

    // sleep 100ms to allow all events to be logged
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Is a delete event logged?
    const deleteEvents = await prisma.event.findMany({
      where: { type: EventType.PURGE, note_id: id },
    });
    expect(deleteEvents.length).toBe(1);
    expect(deleteEvents[0].success).toBe(true);
    expect(deleteEvents[0].size_bytes).toBe(
      testNote.ciphertext.length + testNote.hmac.length
    );
  });
});
