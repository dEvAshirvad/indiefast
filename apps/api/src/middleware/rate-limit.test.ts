import { randomUUID } from "node:crypto";
import express from "express";
import request from "supertest";
import { expect, test } from "vitest";
import { createRedis } from "../configs/db/redis.js";
import { env } from "../configs/env.js";
import { responder } from "../lib/responder.js";
import { errorHandler } from "./error-handler.js";
import { createRateLimiter, createRedisRateLimitStore } from "./rate-limit.js";
import { requestLogger } from "./request-logger.js";

function probeApp() {
  const app = express();
  app.use(requestLogger);
  app.use(responder);
  app.use(createRateLimiter({ windowMs: 60_000, max: 2, skipPaths: [] }));
  app.get("/probe", (_req, res) => {
    res.ok({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

test("the third request in the window is 429 RATE_LIMITED", async () => {
  const app = probeApp();

  expect((await request(app).get("/probe")).status).toBe(200);
  expect((await request(app).get("/probe")).status).toBe(200);

  const limited = await request(app).get("/probe");
  expect(limited.status).toBe(429);
  expect(limited.body).toMatchObject({
    success: false,
    error: { code: "RATE_LIMITED" },
  });
  expect(limited.body.meta.requestId).toEqual(limited.headers["x-request-id"]);
});

test("a new Redis store keeps the previous count", async () => {
  const redis = createRedis(env.redisHost, env.redisPort, env.redisPassword);
  const key = randomUUID();
  const first = createRedisRateLimitStore(redis.client, 60_000);
  const second = createRedisRateLimitStore(redis.client, 60_000);

  try {
    expect((await first.increment(key)).totalHits).toBe(1);
    expect((await second.increment(key)).totalHits).toBe(2);
  } finally {
    await first.resetKey(key);
    await redis.close();
  }
});
