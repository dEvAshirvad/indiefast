import express from "express";
import request from "supertest";
import { expect, test } from "vitest";
import { getRedis } from "../configs/db/redis.js";
import { responder } from "../lib/responder.js";
import { errorHandler } from "./error-handler.js";
import { idempotency } from "./idempotency.js";

test("replays the first body and skips the handler", async () => {
  let calls = 0;
  const app = express();
  app.use(express.json());
  app.use(responder);
  app.post("/count", idempotency(), (req, res) => {
    calls += 1;
    res.ok(req.body);
  });
  app.use(errorHandler);

  const redis = getRedis();
  await redis.ping();
  await redis.client.del("idem:same");

  try {
    const first = await request(app)
      .post("/count")
      .set("Idempotency-Key", "same")
      .send({ n: 1 });
    const second = await request(app)
      .post("/count")
      .set("Idempotency-Key", "same")
      .send({ n: 2 });
    const fresh = await request(app).post("/count").send({ n: 3 });

    expect(first.status).toBe(200);
    expect(first.body.data).toEqual({ n: 1 });
    expect(second.status).toBe(200);
    expect(second.body.data).toEqual({ n: 1 });
    expect(fresh.body.data).toEqual({ n: 3 });
    expect(calls).toBe(2);
  } finally {
    await redis.client.del("idem:same");
  }
});
