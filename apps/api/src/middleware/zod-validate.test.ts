import express from "express";
import request from "supertest";
import { expect, test } from "vitest";
import { z } from "zod";
import { responder } from "../lib/responder.js";
import { errorHandler } from "./error-handler.js";
import { validateBody, validateParams } from "./zod-validate.js";

test("validateBody replaces req.body with the parsed value", async () => {
  const app = express();
  app.use(express.json());
  app.use(responder);
  app.post(
    "/echo",
    validateBody(z.object({ message: z.string().min(1) })),
    (req, res) => {
      res.ok(req.body);
    },
  );
  app.use(errorHandler);

  const response = await request(app)
    .post("/echo")
    .send({ message: "hi", nope: true });

  expect(response.status).toBe(200);
  expect(response.body.data).toEqual({ message: "hi" });
});

test("validateParams replaces req.params with the parsed value", async () => {
  const app = express();
  app.use(responder);
  app.get(
    "/files/:id",
    validateParams(z.object({ id: z.uuid() })),
    (req, res) => {
      res.ok(req.params);
    },
  );
  app.use(errorHandler);

  const id = crypto.randomUUID();
  const ok = await request(app).get(`/files/${id}`);
  expect(ok.status).toBe(200);
  expect(ok.body.data).toEqual({ id });

  const bad = await request(app).get("/files/not-a-uuid");
  expect(bad.status).toBe(422);
  expect(bad.body.error.code).toBe("VALIDATION");
});
