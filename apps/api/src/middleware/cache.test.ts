import { randomUUID } from "node:crypto";
import express from "express";
import request from "supertest";
import { expect, test } from "vitest";
import { getRedis } from "../configs/db/redis.js";
import { responder } from "../lib/responder.js";
import { cacheResponse } from "./cache.js";

test("caches an allowlisted GET and leaves other paths alone", async () => {
  let healthCalls = 0;
  let sessionCalls = 0;
  const app = express();
  app.use((_req, res, next) => {
    const requestId = randomUUID();
    res.locals.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  });
  app.use(responder);
  app.use(cacheResponse(["/health"]));
  app.get("/health", (_req, res) => {
    healthCalls += 1;
    res.ok({ n: healthCalls });
  });
  app.get("/api/auth/session", (_req, res) => {
    sessionCalls += 1;
    res.ok({ n: sessionCalls });
  });

  const redis = getRedis();
  await redis.ping();
  await redis.client.del("cache:/health");

  try {
    const first = await request(app).get("/health");
    const second = await request(app).get("/health");
    const sessionA = await request(app).get("/api/auth/session");
    const sessionB = await request(app).get("/api/auth/session");

    expect(first.body.data).toEqual({ n: 1 });
    expect(second.body.data).toEqual({ n: 1 });
    expect(second.body.meta.requestId).toBe(second.headers["x-request-id"]);
    expect(second.body.meta.requestId).not.toBe(first.body.meta.requestId);
    expect(sessionA.body.data).toEqual({ n: 1 });
    expect(sessionB.body.data).toEqual({ n: 2 });
    expect(healthCalls).toBe(1);
    expect(sessionCalls).toBe(2);
  } finally {
    await redis.client.del("cache:/health");
  }
});
