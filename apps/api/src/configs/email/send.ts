import { env } from "../env.js";
import { AppError } from "../errors/api-error.js";
import { coreErrors } from "../errors/core-errors.js";
import type {
  EmailProvider,
  EmailTransport,
  OutboundEmail,
} from "./message.js";
import { createResendTransport } from "./resend.js";
import { createSesTransport } from "./ses.js";
import { createSmtpTransport } from "./smtp.js";

export function createMailer(input: {
  provider: EmailProvider;
  transports: Partial<Record<EmailProvider, EmailTransport>>;
}) {
  return async function send(message: OutboundEmail) {
    const transport = input.transports[input.provider];
    if (!transport) {
      throw new AppError({
        code: coreErrors.EMAIL_NOT_CONFIGURED.code,
        status: coreErrors.EMAIL_NOT_CONFIGURED.status,
        message: `Email provider ${input.provider} is not configured`,
      });
    }
    await transport(message);
  };
}

export const send = createMailer({
  provider: env.emailProvider,
  transports: {
    smtp: createSmtpTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      user: env.smtpUser,
      pass: env.smtpPass,
      from: env.emailFrom,
    }),
    ses: createSesTransport({
      accessKeyId: env.sesAccessKeyId,
      secretAccessKey: env.sesSecretAccessKey,
      region: env.sesRegion,
      from: env.emailFrom,
    }),
    resend: createResendTransport({
      apiKey: env.resendApiKey,
      from: env.emailFrom,
    }),
  },
});
