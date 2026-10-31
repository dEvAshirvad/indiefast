import express from "express";
import request from "supertest";
import { expect, test } from "vitest";
import { security } from "./security.js";

function app() {
  const server = express();
  server.use(security);
  server.get("/health", (_req, res) => {
    res.json({ ok: true });
  });
  server.get("/", (req, res) => {
    res.json({ a: req.query.a });
  });
  return server;
}

test("helmet sets nosniff and hides x-powered-by", async () => {
  const response = await request(app()).get("/health");

  expect(response.status).toBe(200);
  expect(response.headers["x-content-type-options"]).toBe("nosniff");
  expect(response.headers["x-powered-by"]).toBeUndefined();
});

test("hpp keeps the last value of a duplicated query key", async () => {
  const response = await request(app()).get("/?a=1&a=2");

  expect(response.status).toBe(200);
  expect(response.body.a).toBe("2");
});
