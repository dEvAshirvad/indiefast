import { z } from "zod";

export const emailTemplates = ["welcome", "verify", "reset"] as const;

export const emailTestSchema = z
  .object({
    to: z.email(),
    template: z.enum(emailTemplates),
    url: z.url().optional(),
  })
  .refine((value) => value.template === "welcome" || Boolean(value.url), {
    path: ["url"],
    message: "url is required",
  });

export type EmailTestInput = z.infer<typeof emailTestSchema>;
