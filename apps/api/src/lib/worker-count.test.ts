import { expect, test } from "vitest";
import { resolveWorkerCount } from "./worker-count.js";

test("one core stays a single process", () => {
  expect(resolveWorkerCount(1, undefined)).toBe(1);
});

test("two cores take four workers", () => {
  expect(resolveWorkerCount(2, undefined)).toBe(4);
});

test("more than four CPUs uses all of them", () => {
  expect(resolveWorkerCount(8, undefined)).toBe(8);
});

test("CLUSTER_WORKERS=1 forces a single process", () => {
  expect(resolveWorkerCount(8, "1")).toBe(1);
});

test("CLUSTER_WORKERS can set an explicit count", () => {
  expect(resolveWorkerCount(8, "6")).toBe(6);
});
