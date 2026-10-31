import type { EmailTransport } from "../../configs/email/message.js";
import { send } from "../../configs/email/send.js";
import { renderEmail } from "./templates.js";

export async function deliverEmail(
  value: unknown,
  sendMessage: EmailTransport = send,
) {
  await sendMessage(renderEmail(value));
}
