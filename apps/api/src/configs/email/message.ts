export type OutboundEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailTransport = (message: OutboundEmail) => Promise<void>;

export type EmailProvider = "smtp" | "ses" | "resend";
