import request from "supertest";
import { expect, test } from "vitest";
import { createApp } from "../configs/server-config.js";

function countOf(body: string): number {
  const match = /^http_requests_total (\d+)\n$/.exec(body);
  if (!match?.[1]) throw new Error(body);
  return Number(match[1]);
}

test("GET /metrics is a plain counter outside the rate limit", async () => {
  const app = createApp();
  const before = await request(app).get("/metrics");
  await request(app).get("/health");
  const after = await request(app).get("/metrics");

  expect(before.status).toBe(200);
  expect(before.headers["content-type"]).toMatch(/text\/plain/);
  expect(before.text).not.toContain("success");
  expect(countOf(after.text)).toBe(countOf(before.text) + 1);

  for (let i = 0; i < 20; i += 1) {
    expect((await request(app).get("/metrics")).status).toBe(200);
  }
});
