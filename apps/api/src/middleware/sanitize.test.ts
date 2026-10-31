import express from "express";
import request from "supertest";
import { expect, test } from "vitest";
import { responder } from "../lib/responder.js";
import { errorHandler } from "./error-handler.js";
import { sanitize } from "./sanitize.js";

function app() {
  const server = express();
  server.use(express.json());
  server.use(responder);
  server.use(sanitize);
  server.post("/echo", (req, res) => {
    res.ok(req.body);
  });
  server.use(errorHandler);
  return server;
}

test("rejects a constructor prototype body", async () => {
  const response = await request(app())
    .post("/echo")
    .send({ constructor: { prototype: { admin: true } } });

  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe("BAD_REQUEST");
});

test("rejects a null byte in a string", async () => {
  const response = await request(app())
    .post("/echo")
    .send({ message: "a\u0000b" });

  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe("BAD_REQUEST");
});

test("leaves a normal body unchanged", async () => {
  const response = await request(app()).post("/echo").send({ message: "hi" });

  expect(response.status).toBe(200);
  expect(response.body.data).toEqual({ message: "hi" });
});
