import express from "express";
import request from "supertest";
import { expect, test } from "vitest";
import { responder } from "../lib/responder.js";
import { errorHandler } from "./error-handler.js";

test("unexpected errors keep the stack in the log and a catalog message in the response", async () => {
  const app = express();
  app.use(responder);
  app.get("/crash", async () => {
    throw new Error("secret db password");
  });
  app.use(errorHandler);

  const response = await request(app).get("/crash");

  expect(response.status).toBe(500);
  expect(response.body).toMatchObject({
    success: false,
    error: { code: "INTERNAL", message: "Something went wrong" },
    meta: { requestId: "unknown" },
  });
  expect(response.text).not.toContain("secret");
});
