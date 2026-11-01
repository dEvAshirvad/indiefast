import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { emailFrom as defaultEmailFrom } from "./email/from.js";

export const envFilePath = fileURLToPath(
  new URL("../../../../.env", import.meta.url),
);

export function resolveEmailApiEnabled(
  nodeEnv: string,
  flag: string | undefined,
): boolean {
  if (flag === "true") return true;
  if (flag === "false") return false;
  return nodeEnv === "development";
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

if (existsSync(envFilePath)) {
  process.loadEnvFile(envFilePath);
}

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    APP_HOST: z.string().min(1).default("localhost"),
    WEB_URL: z.url().default("http://localhost:3000"),
    DATABASE_HOST: z.string().min(1),
    DATABASE_PORT: z.coerce.number().int().positive().default(5432),
    DATABASE_USER: z.string().min(1),
    DATABASE_PASSWORD: z.string().min(1),
    DATABASE_NAME: z.string().min(1),
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().min(1),
    S3_HOST: z.string().min(1),
    S3_PORT: z.coerce.number().int().positive().default(9000),
    S3_ACCESS_KEY: z.string().min(1),
    S3_SECRET_KEY: z.string().min(1),
    S3_BUCKET: z.string().min(1),
    S3_REGION: z.string().min(1),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_PROVIDER: z.enum(["smtp", "ses", "resend"]).default("smtp"),
    EMAIL_FROM: z.string().optional(),
    EMAIL_API_ENABLED: z.enum(["true", "false"]).optional(),
    RESEND_API_KEY: z.string().optional(),
    SES_ACCESS_KEY_ID: z.string().optional(),
    SES_SECRET_ACCESS_KEY: z.string().optional(),
    SES_REGION: z.string().optional(),
    ADMIN_EMAIL: z.email().default("admin@indiefast.local"),
    ADMIN_PASSWORD: z.string().min(8).default("indiefast-admin"),
    AUTH_SECRET: z.string().min(16).default("dev-auth-secret-change-me"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    CLUSTER_WORKERS: z
      .string()
      .optional()
      .transform((value) => blankToUndefined(value))
      .refine((value) => value === undefined || /^[1-9]\d*$/.test(value), {
        message: "must be an integer >= 1",
      }),
  })
  .transform((value) => ({
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    appHost: value.APP_HOST,
    webUrl: value.WEB_URL,
    databaseHost: value.DATABASE_HOST,
    databasePort: value.DATABASE_PORT,
    databaseUser: value.DATABASE_USER,
    databasePassword: value.DATABASE_PASSWORD,
    databaseName: value.DATABASE_NAME,
    redisHost: value.REDIS_HOST,
    redisPort: value.REDIS_PORT,
    redisPassword: value.REDIS_PASSWORD,
    s3Host: value.S3_HOST,
    s3Port: value.S3_PORT,
    s3AccessKey: value.S3_ACCESS_KEY,
    s3SecretKey: value.S3_SECRET_KEY,
    s3Bucket: value.S3_BUCKET,
    s3Region: value.S3_REGION,
    smtpHost: value.SMTP_HOST,
    smtpPort: value.SMTP_PORT,
    smtpUser: blankToUndefined(value.SMTP_USER),
    smtpPass: blankToUndefined(value.SMTP_PASS),
    emailProvider: value.EMAIL_PROVIDER,
    emailFrom: blankToUndefined(value.EMAIL_FROM) ?? defaultEmailFrom,
    emailApiEnabled: resolveEmailApiEnabled(
      value.NODE_ENV,
      value.EMAIL_API_ENABLED,
    ),
    resendApiKey: blankToUndefined(value.RESEND_API_KEY),
    sesAccessKeyId: blankToUndefined(value.SES_ACCESS_KEY_ID),
    sesSecretAccessKey: blankToUndefined(value.SES_SECRET_ACCESS_KEY),
    sesRegion: blankToUndefined(value.SES_REGION),
    adminEmail: value.ADMIN_EMAIL,
    adminPassword: value.ADMIN_PASSWORD,
    authSecret: value.AUTH_SECRET,
    googleClientId: value.GOOGLE_CLIENT_ID,
    googleClientSecret: value.GOOGLE_CLIENT_SECRET,
    githubClientId: value.GITHUB_CLIENT_ID,
    githubClientSecret: value.GITHUB_CLIENT_SECRET,
    clusterWorkers: value.CLUSTER_WORKERS,
  }));

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment\n${details}`);
  }

  return parsed.data;
}

export const env = loadEnv();
