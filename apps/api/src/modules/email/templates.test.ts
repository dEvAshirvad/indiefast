import { expect, test } from "vitest";
import { renderEmail, verifyEmail } from "./templates.js";

test("verify template contains the link it was given", () => {
  const url = "http://localhost:4000/api/auth/verify-email?token=abc";
  const content = verifyEmail(url);
  expect(content.subject).toBe("Verify your email");
  expect(content.text).toContain(url);
  expect(content.html).toContain(url);
  expect(content.html).toContain("href=");
});

test("renderEmail refuses a verify job without a url", () => {
  expect(() =>
    renderEmail({ to: "a@example.com", template: "verify" }),
  ).toThrow(/missing a url/);
});

test("welcome has subject, html, and text", () => {
  const message = renderEmail({ to: "a@example.com", template: "welcome" });
  expect(message.to).toBe("a@example.com");
  expect(message.subject.length).toBeGreaterThan(0);
  expect(message.html.length).toBeGreaterThan(0);
  expect(message.text.length).toBeGreaterThan(0);
});
