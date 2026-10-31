import type { OutboundEmail } from "../../configs/email/message.js";
import { type EmailJob, parseEmailJob } from "./job.js";

export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function welcomeEmail(): EmailContent {
  const text = "Your account is ready.";
  return {
    subject: "Welcome to IndieFast",
    text,
    html: `<p>${text}</p>`,
  };
}

export function verifyEmail(url: string): EmailContent {
  return {
    subject: "Verify your email",
    text: `Verify your email: ${url}`,
    html: `<p><a href="${escapeHtml(url)}">Verify your email</a></p>`,
  };
}

export function resetEmail(url: string): EmailContent {
  return {
    subject: "Reset your password",
    text: `Reset your password: ${url}`,
    html: `<p><a href="${escapeHtml(url)}">Reset your password</a></p>`,
  };
}

export function renderEmail(value: unknown): OutboundEmail {
  const job: EmailJob = parseEmailJob(value);
  if (job.template === "welcome") {
    return { to: job.to, ...welcomeEmail() };
  }
  const content =
    job.template === "verify"
      ? verifyEmail(job.url ?? "")
      : resetEmail(job.url ?? "");
  return { to: job.to, ...content };
}
