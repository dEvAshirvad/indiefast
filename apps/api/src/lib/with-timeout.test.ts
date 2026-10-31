import { expect, test } from "vitest";
import { withTimeout } from "./with-timeout.js";

test("resolves when the promise wins", async () => {
  await expect(withTimeout(Promise.resolve("ok"), 50)).resolves.toBe("ok");
});

test("a promise that never settles rejects TimeoutError", async () => {
  await expect(
    withTimeout(new Promise(() => undefined), 20),
  ).rejects.toMatchObject({
    name: "TimeoutError",
    message: "Timed out after 20ms",
  });
});
