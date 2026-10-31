import { AppError } from "../errors/api-error.js";
import { coreErrors } from "../errors/core-errors.js";
import { emailFrom } from "./from.js";
import type { EmailTransport, OutboundEmail } from "./message.js";
import { createProviderPost } from "./post.js";

const postJson = createProviderPost();

export function createResendTransport(input: {
  apiKey?: string;
  from?: string;
  post?: (url: string, init: RequestInit) => Promise<void>;
}): EmailTransport {
  const post = input.post ?? postJson;
  const from = input.from ?? emailFrom;
  return async (message: OutboundEmail) => {
    if (!input.apiKey) {
      throw new AppError({
        code: coreErrors.EMAIL_NOT_CONFIGURED.code,
        status: coreErrors.EMAIL_NOT_CONFIGURED.status,
        message: "Resend API key is missing",
      });
    }
    await post("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
  };
}
