import { expect, test } from "vitest";
import { AppError } from "./api-error.js";

test("AppError carries the code, status, and message", () => {
  const error = new AppError({
    code: "INTERNAL",
    status: 500,
    message: "Boom",
  });

  expect(error).toBeInstanceOf(Error);
  expect(error.name).toBe("AppError");
  expect(error.code).toBe("INTERNAL");
  expect(error.status).toBe(500);
  expect(error.message).toBe("Boom");
});
