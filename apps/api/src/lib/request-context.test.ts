import express from "express";
import request from "supertest";
import { expect, test } from "vitest";
import { getRequestId, runWithRequestId } from "./request-context.js";
import { responder } from "./responder.js";

test("runWithRequestId keeps the id across an await and then drops it", async () => {
  await runWithRequestId("abc", async () => {
    await Promise.resolve();
    expect(getRequestId()).toBe("abc");
  });
  expect(getRequestId()).toBeUndefined();
});

test("the responder reads the id from context when locals are empty", async () => {
  const app = express();
  app.use((_req, _res, next) => {
    runWithRequestId("req-1", () => next());
  });
  app.use(responder);
  app.get("/ok", (_req, res) => {
    res.ok({ ok: true });
  });

  const response = await request(app).get("/ok");

  expect(response.status).toBe(200);
  expect(response.body.meta.requestId).toBe("req-1");
});
