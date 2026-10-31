import nodemailer from "nodemailer";
import { expect, test } from "vitest";
import { createResendTransport } from "./resend.js";
import { createMailer } from "./send.js";
import { createSesTransport } from "./ses.js";
import { createSmtpTransport, smtpConnection } from "./smtp.js";

const message = {
  to: "a@example.com",
  subject: "Hi",
  html: "<p>Hi</p>",
  text: "Hi",
};

test("smtp auth is set only when both user and pass exist", () => {
  expect(smtpConnection({ host: "localhost", port: 1025 })).toMatchObject({
    secure: false,
    auth: undefined,
  });
  expect(
    smtpConnection({
      host: "smtp.example.com",
      port: 465,
      user: "mailer",
      pass: "secret",
    }),
  ).toMatchObject({
    secure: true,
    auth: { user: "mailer", pass: "secret" },
  });
});

test("the smtp arm delivers the message to its transport", async () => {
  const transporter = nodemailer.createTransport({ jsonTransport: true });
  const send = createMailer({
    provider: "smtp",
    transports: { smtp: createSmtpTransport({ transporter }) },
  });
  await expect(send(message)).resolves.toBeUndefined();
});

test("ses throws EMAIL_NOT_CONFIGURED when the key is missing", async () => {
  const send = createMailer({
    provider: "ses",
    transports: { ses: createSesTransport({}) },
  });
  await expect(send(message)).rejects.toMatchObject({
    name: "AppError",
    code: "EMAIL_NOT_CONFIGURED",
    message: "SES credentials are missing",
  });
});

test("resend posts the message when the key is present", async () => {
  const calls: Array<{ url: string; body: string }> = [];
  const send = createMailer({
    provider: "resend",
    transports: {
      resend: createResendTransport({
        apiKey: "re_test",
        post: async (url, init) => {
          calls.push({ url, body: String(init.body) });
        },
      }),
    },
  });
  await send(message);
  expect(calls).toEqual([
    {
      url: "https://api.resend.com/emails",
      body: JSON.stringify({
        from: "IndieFast <noreply@indiefast.local>",
        to: ["a@example.com"],
        subject: "Hi",
        html: "<p>Hi</p>",
        text: "Hi",
      }),
    },
  ]);
});

test("resend throws EMAIL_NOT_CONFIGURED when the key is missing", async () => {
  const send = createMailer({
    provider: "resend",
    transports: { resend: createResendTransport({}) },
  });
  await expect(send(message)).rejects.toMatchObject({
    code: "EMAIL_NOT_CONFIGURED",
    message: "Resend API key is missing",
  });
});
