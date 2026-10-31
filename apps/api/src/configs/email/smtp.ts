import nodemailer, { type Transporter } from "nodemailer";
import { emailFrom } from "./from.js";
import type { EmailTransport, OutboundEmail } from "./message.js";

export function smtpConnection(input: {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
}) {
  return {
    host: input.host,
    port: input.port,
    secure: input.port === 465,
    auth:
      input.user && input.pass
        ? { user: input.user, pass: input.pass }
        : undefined,
    connectionTimeout: 2_000,
    greetingTimeout: 2_000,
    socketTimeout: 2_000,
  };
}

export function createSmtpTransport(input: {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  transporter?: Transporter;
}): EmailTransport {
  const from = input.from ?? emailFrom;
  const transporter =
    input.transporter ?? nodemailer.createTransport(smtpConnection(input));

  return async (message: OutboundEmail) => {
    await transporter.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  };
}
