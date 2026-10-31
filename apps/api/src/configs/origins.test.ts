import { describe, expect, test } from "vitest";
import { isAllowedOrigin } from "./origins.js";

const allowlist = ["http://localhost:3000"];

describe("isAllowedOrigin", () => {
  test("allows a missing origin so curl and server calls still work", () => {
    expect(isAllowedOrigin(undefined, allowlist)).toBe(true);
  });

  test("allows an origin on the list", () => {
    expect(isAllowedOrigin("http://localhost:3000", allowlist)).toBe(true);
  });

  test("rejects an origin that is not on the list", () => {
    expect(isAllowedOrigin("http://evil.example", allowlist)).toBe(false);
  });
});
