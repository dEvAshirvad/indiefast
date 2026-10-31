import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { createBreaker } from "../../lib/circuit-breaker.js";
import { withTimeout } from "../../lib/with-timeout.js";
import { AppError } from "../errors/api-error.js";
import { coreErrors } from "../errors/core-errors.js";
import { emailFrom } from "./from.js";
import type { EmailTransport, OutboundEmail } from "./message.js";

export function createSesTransport(input: {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  from?: string;
  sendCommand?: (message: OutboundEmail) => Promise<void>;
}): EmailTransport {
  let breaker:
    | ReturnType<typeof createBreaker<[OutboundEmail], void>>
    | undefined;

  return async (message: OutboundEmail) => {
    if (!input.accessKeyId || !input.secretAccessKey || !input.region) {
      throw new AppError({
        code: coreErrors.EMAIL_NOT_CONFIGURED.code,
        status: coreErrors.EMAIL_NOT_CONFIGURED.status,
        message: "SES credentials are missing",
      });
    }

    breaker ??= createBreaker(
      async (next: OutboundEmail) => {
        await withTimeout(
          (async () => {
            if (input.sendCommand) {
              await input.sendCommand(next);
              return;
            }
            await sendWithSes(input, next, input.from ?? emailFrom);
          })(),
          5_000,
        );
      },
      { timeout: 5_100 },
    );
    await breaker.fire(message);
  };
}

function sendWithSes(
  input: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
  },
  message: OutboundEmail,
  from: string,
) {
  const client = new SESv2Client({
    region: input.region,
    credentials: {
      accessKeyId: input.accessKeyId ?? "",
      secretAccessKey: input.secretAccessKey ?? "",
    },
  });
  return client.send(
    new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: [message.to] },
      Content: {
        Simple: {
          Subject: { Data: message.subject },
          Body: {
            Html: { Data: message.html },
            Text: { Data: message.text },
          },
        },
      },
    }),
  );
}
