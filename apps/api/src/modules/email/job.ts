export const emailTemplates = ["welcome", "verify", "reset"] as const;

export type EmailTemplate = (typeof emailTemplates)[number];

export type EmailJob = {
  to: string;
  template: EmailTemplate;
  url?: string;
};

export function parseEmailJob(value: unknown): EmailJob {
  if (!value || typeof value !== "object") {
    throw new Error("email job is invalid");
  }
  const job = value as Record<string, unknown>;
  if (typeof job.to !== "string" || !job.to.includes("@")) {
    throw new Error("email job is missing a recipient");
  }
  if (
    job.template !== "welcome" &&
    job.template !== "verify" &&
    job.template !== "reset"
  ) {
    throw new Error("email job template is invalid");
  }
  if (job.template !== "welcome" && typeof job.url !== "string") {
    throw new Error(`${job.template} email is missing a url`);
  }
  return {
    to: job.to,
    template: job.template,
    url: typeof job.url === "string" ? job.url : undefined,
  };
}
