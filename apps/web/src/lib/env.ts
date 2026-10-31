import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url().default("http://localhost:4000"),
});

const emailFlag = process.env.NEXT_PUBLIC_EMAIL_API_ENABLED;

const parsed = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

export const env = {
  apiUrl: parsed.NEXT_PUBLIC_API_URL,
  emailApiEnabled:
    emailFlag === "true" ||
    (emailFlag !== "false" && process.env.NODE_ENV !== "production"),
};
