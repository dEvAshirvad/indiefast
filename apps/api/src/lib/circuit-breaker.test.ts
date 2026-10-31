import { expect, test } from "vitest";
import { createBreaker } from "./circuit-breaker.js";

test("opens after the threshold and stops calling the action", async () => {
  let calls = 0;
  const breaker = createBreaker(
    async () => {
      calls += 1;
      throw new Error("down");
    },
    {
      timeout: 50,
      errorThresholdPercentage: 50,
      volumeThreshold: 2,
      resetTimeout: 60_000,
    },
  );

  await expect(breaker.fire()).rejects.toThrow("down");
  await expect(breaker.fire()).rejects.toThrow("down");
  await expect(breaker.fire()).rejects.toThrow(/open/i);
  expect(calls).toBe(2);
});
