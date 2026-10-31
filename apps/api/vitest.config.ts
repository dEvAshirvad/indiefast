import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const envFile = fileURLToPath(new URL("../../.env", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      APP_HOST: process.env.APP_HOST ?? "localhost",
      DATABASE_HOST: process.env.DATABASE_HOST ?? "localhost",
      DATABASE_PORT: process.env.DATABASE_PORT ?? "5432",
      DATABASE_USER: process.env.DATABASE_USER ?? "indiefast",
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ?? "indiefast",
      DATABASE_NAME: process.env.DATABASE_NAME ?? "indiefast",
      REDIS_HOST: process.env.REDIS_HOST ?? "localhost",
      REDIS_PORT: process.env.REDIS_PORT ?? "6379",
      REDIS_PASSWORD: process.env.REDIS_PASSWORD ?? "indiefast",
      S3_HOST: process.env.S3_HOST ?? "localhost",
      S3_PORT: process.env.S3_PORT ?? "9000",
      S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? "indiefast",
      S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? "indiefastindiefast",
      S3_BUCKET: process.env.S3_BUCKET ?? "indiefast",
      S3_REGION: process.env.S3_REGION ?? "us-east-1",
      SMTP_HOST: process.env.SMTP_HOST ?? "localhost",
      SMTP_PORT: process.env.SMTP_PORT ?? "1025",
      EMAIL_API_ENABLED: "true",
    },
    include: ["src/**/*.test.ts"],
  },
});
