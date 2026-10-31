import request from "supertest";
import { describe, expect, test } from "vitest";
import { getRedis } from "./db/redis.js";
import { createApp } from "./server-config.js";

const requestId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("createApp", () => {
  test("GET /health returns the success envelope", async () => {
    const response = await request(createApp()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { ok: true },
    });
    expect(response.body.meta.requestId).toMatch(requestId);
    expect(response.headers["x-request-id"]).toBe(response.body.meta.requestId);
  });

  test("GET /boom returns the thrown AppError", async () => {
    const response = await request(createApp()).get("/boom");

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "INTERNAL", message: "Boom" },
    });
    expect(response.body.meta.requestId).toMatch(requestId);
    expect(response.headers["x-request-id"]).toBe(response.body.meta.requestId);
  });

  test("an unknown route uses the error envelope", async () => {
    const response = await request(createApp()).get("/missing");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(response.body.meta.requestId).toMatch(requestId);
  });

  test("allows the web origin and exposes the request id", async () => {
    const response = await request(createApp())
      .get("/health")
      .set("Origin", "http://localhost:3000");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
    expect(response.headers["access-control-expose-headers"]).toMatch(
      /x-request-id/i,
    );
  });

  test("rejects a foreign origin", async () => {
    const response = await request(createApp())
      .get("/health")
      .set("Origin", "http://evil.example");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ORIGIN_NOT_ALLOWED");
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    expect(response.body.meta.requestId).toMatch(requestId);
  });

  test("preflight from the web origin is allowed", async () => {
    const response = await request(createApp())
      .options("/health")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "GET");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
  });

  test("health stays off the rate-limit budget", async () => {
    const app = createApp();
    for (let i = 0; i < 5; i += 1) {
      expect((await request(app).get("/health")).status).toBe(200);
    }
  });

  test("GET /api/openapi.json documents /health", async () => {
    const response = await request(createApp()).get("/api/openapi.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toMatch(/^3\./);
    expect(response.body.paths["/health"].get).toBeDefined();
    expect(response.body.components.schemas.ErrorEnvelope).toBeDefined();
  });

  test("POST /echo returns the parsed message and drops unknown keys", async () => {
    const response = await request(createApp())
      .post("/echo")
      .send({ message: "hi", nope: true });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { message: "hi" },
    });
    expect(response.body.data.nope).toBeUndefined();
  });

  test("POST /echo replays the first body for the same Idempotency-Key", async () => {
    const redis = getRedis();
    await redis.ping();
    await redis.client.del("idem:echo-1");
    const app = createApp();

    try {
      const first = await request(app)
        .post("/echo")
        .set("Idempotency-Key", "echo-1")
        .send({ message: "hi" });
      const second = await request(app)
        .post("/echo")
        .set("Idempotency-Key", "echo-1")
        .send({ message: "other" });

      expect(first.status).toBe(200);
      expect(first.body.data.message).toBe("hi");
      expect(second.status).toBe(200);
      expect(second.body.data.message).toBe("hi");
    } finally {
      await redis.client.del("idem:echo-1");
    }
  });

  test("POST /echo rejects an empty body as 422", async () => {
    const response = await request(createApp()).post("/echo").send({});

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION");
  });

  test("POST /echo rejects malformed JSON as 422", async () => {
    const response = await request(createApp())
      .post("/echo")
      .set("Content-Type", "application/json")
      .send("{");

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION");
    expect(response.text).not.toContain("SyntaxError");
  });

  test("GET /favicon.ico serves the dev emoji", async () => {
    const response = await request(createApp()).get("/favicon.ico");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/image\/svg\+xml/);
    const body = Buffer.isBuffer(response.body)
      ? response.body.toString("utf8")
      : String(response.text);
    expect(body).toContain("⚡");
  });

  test("GET /api/reference serves the Scalar page", async () => {
    const response = await request(createApp()).get("/api/reference");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/html/);
  });
});
