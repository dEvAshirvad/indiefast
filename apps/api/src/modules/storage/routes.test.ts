import { eq } from "drizzle-orm";
import request from "supertest";
import { afterEach, expect, test, vi } from "vitest";
import { getPostgres } from "../../configs/db/postgres.js";
import { user } from "../auth/model/core.js";

const getRequestSession = vi.fn();
vi.mock("../../lib/auth-session.js", () => ({
  getRequestSession: (...args: unknown[]) => getRequestSession(...args),
}));

const { createApp } = await import("../../configs/server-config.js");

function sessionFor(userId: string) {
  return {
    user: {
      id: userId,
      email: `${userId}@example.com`,
      name: "Owner",
      role: "user",
    },
    session: { id: crypto.randomUUID(), expiresAt: new Date().toISOString() },
  };
}

async function insertUser() {
  const id = crypto.randomUUID();
  await getPostgres()
    .db.insert(user)
    .values({
      id,
      email: `${id}@example.com`,
      name: "Route Owner",
      role: "user",
      emailVerified: false,
    });
  return id;
}

afterEach(() => {
  getRequestSession.mockReset();
});

test("POST /api/storage/uploads without a session is 401", async () => {
  getRequestSession.mockResolvedValue(null);
  const response = await request(createApp())
    .post("/api/storage/uploads")
    .send({
      filename: "a.png",
      contentType: "image/png",
      sizeBytes: 1,
    });
  expect(response.status).toBe(401);
  expect(response.body.error.code).toBe("UNAUTHORIZED");
});

test("POST /api/storage/uploads rejects an empty body as 422", async () => {
  const ownerId = await insertUser();
  getRequestSession.mockResolvedValue(sessionFor(ownerId));
  try {
    const response = await request(createApp())
      .post("/api/storage/uploads")
      .send({});
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION");
  } finally {
    await getPostgres().db.delete(user).where(eq(user.id, ownerId));
  }
});

test("POST /api/storage/uploads rejects sizeBytes above 10 MiB as 422", async () => {
  const ownerId = await insertUser();
  getRequestSession.mockResolvedValue(sessionFor(ownerId));
  try {
    const response = await request(createApp())
      .post("/api/storage/uploads")
      .send({
        filename: "big.png",
        contentType: "image/png",
        sizeBytes: 10_485_761,
      });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION");
  } finally {
    await getPostgres().db.delete(user).where(eq(user.id, ownerId));
  }
});

test("POST /api/storage/uploads rejects application/pdf as 422", async () => {
  const ownerId = await insertUser();
  getRequestSession.mockResolvedValue(sessionFor(ownerId));
  try {
    const response = await request(createApp())
      .post("/api/storage/uploads")
      .send({
        filename: "notes.pdf",
        contentType: "application/pdf",
        sizeBytes: 1,
      });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION");
  } finally {
    await getPostgres().db.delete(user).where(eq(user.id, ownerId));
  }
});

test("POST /api/storage/uploads rejects image/svg+xml as 422", async () => {
  const ownerId = await insertUser();
  getRequestSession.mockResolvedValue(sessionFor(ownerId));
  try {
    const response = await request(createApp())
      .post("/api/storage/uploads")
      .send({
        filename: "icon.svg",
        contentType: "image/svg+xml",
        sizeBytes: 1,
      });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION");
  } finally {
    await getPostgres().db.delete(user).where(eq(user.id, ownerId));
  }
});

test("POST then GET other owner is 404, owner GET is 200, DELETE is 200", async () => {
  const ownerId = await insertUser();
  const otherId = await insertUser();
  getRequestSession.mockResolvedValue(sessionFor(ownerId));
  const app = createApp();
  try {
    const created = await request(app).post("/api/storage/uploads").send({
      filename: "photo.png",
      contentType: "image/png",
      sizeBytes: 5,
    });
    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    expect(created.body.data.uploadUrl).toEqual(expect.any(String));
    expect(created.body.meta.requestId).toEqual(expect.any(String));
    const id = created.body.data.file.id as string;

    getRequestSession.mockResolvedValue(sessionFor(otherId));
    const hidden = await request(app).get(`/api/storage/files/${id}`);
    expect(hidden.status).toBe(404);
    expect(hidden.body.error.code).toBe("NOT_FOUND");

    getRequestSession.mockResolvedValue(sessionFor(ownerId));
    const got = await request(app).get(`/api/storage/files/${id}`);
    expect(got.status).toBe(200);
    expect(got.body.data.file.id).toBe(id);

    const deleted = await request(app).delete(`/api/storage/files/${id}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data).toEqual({ ok: true });
  } finally {
    await getPostgres().db.delete(user).where(eq(user.id, ownerId));
    await getPostgres().db.delete(user).where(eq(user.id, otherId));
  }
});
