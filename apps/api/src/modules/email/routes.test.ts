import express from "express";
import request from "supertest";
import { afterEach, expect, test, vi } from "vitest";
import { openApiDocument } from "../../configs/openapi.js";
import { responder } from "../../lib/responder.js";
import { errorHandler } from "../../middleware/error-handler.js";
import { notFound } from "../../middleware/not-found.js";
import { createModulesRouter } from "../index.js";

const enqueueEmail = vi.fn();
vi.mock("./enqueue.js", () => ({
  enqueueEmail: (...args: unknown[]) => enqueueEmail(...args),
}));

const getRequestSession = vi.fn();
vi.mock("../../lib/auth-session.js", () => ({
  getRequestSession: (...args: unknown[]) => getRequestSession(...args),
}));

const { createApp } = await import("../../configs/server-config.js");

afterEach(() => {
  enqueueEmail.mockReset();
  getRequestSession.mockReset();
});

test("POST /api/email/test without a session is 401", async () => {
  getRequestSession.mockResolvedValue(null);
  const response = await request(createApp()).post("/api/email/test").send({
    to: "a@example.com",
    template: "welcome",
  });
  expect(response.status).toBe(401);
  expect(response.body.error.code).toBe("UNAUTHORIZED");
  expect(enqueueEmail).not.toHaveBeenCalled();
});

test("POST /api/email/test enqueues a welcome message", async () => {
  getRequestSession.mockResolvedValue({
    user: {
      id: "user-1",
      email: "user-1@example.com",
      name: "Owner",
      role: "user",
    },
    session: { id: "session-1", expiresAt: new Date().toISOString() },
  });
  enqueueEmail.mockResolvedValue({ id: "job-1" });
  const response = await request(createApp())
    .post("/api/email/test")
    .send({ to: "a@example.com", template: "welcome" });
  expect(response.status).toBe(201);
  expect(response.body.data).toEqual({ queued: true });
  expect(enqueueEmail).toHaveBeenCalledWith({
    to: "a@example.com",
    template: "welcome",
    url: undefined,
  });
});

test("POST /api/email/test rejects verify without a url", async () => {
  getRequestSession.mockResolvedValue({
    user: {
      id: "user-1",
      email: "user-1@example.com",
      name: "Owner",
      role: "user",
    },
    session: { id: "session-1", expiresAt: new Date().toISOString() },
  });
  const response = await request(createApp())
    .post("/api/email/test")
    .send({ to: "a@example.com", template: "verify" });
  expect(response.status).toBe(422);
  expect(response.body.error.code).toBe("VALIDATION");
});

test("the email route is 404 when the API flag is off", async () => {
  const app = express();
  app.use(responder);
  app.use(express.json());
  app.use("/api", createModulesRouter({ emailApi: false }));
  app.use(notFound);
  app.use(errorHandler);
  const response = await request(app).post("/api/email/test").send({});
  expect(response.status).toBe(404);
  expect(response.body.error.code).toBe("NOT_FOUND");
});

test("OpenAPI includes the email route while the flag is on", () => {
  expect(openApiDocument.paths["/api/email/test"]).toBeDefined();
});
