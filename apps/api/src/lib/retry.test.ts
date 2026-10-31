import { expect, test, vi } from "vitest";
import { retry } from "./retry.js";

test("retries with exponential backoff until the call succeeds", async () => {
  const sleep = vi.fn(async (_ms: number) => undefined);
  let calls = 0;

  const result = await retry(
    async () => {
      calls += 1;
      if (calls < 3) throw new Error("no");
      return "ok";
    },
    { attempts: 3, baseMs: 10, sleep },
  );

  expect(result).toBe("ok");
  expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([10, 20]);
});

test("does not sleep after the last failure", async () => {
  const sleep = vi.fn(async () => undefined);

  await expect(
    retry(
      async () => {
        throw new Error("last");
      },
      { attempts: 3, baseMs: 10, sleep },
    ),
  ).rejects.toThrow("last");

  expect(sleep).toHaveBeenCalledTimes(2);
});
