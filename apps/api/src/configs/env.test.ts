import { existsSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { envFilePath, loadEnv, resolveEmailApiEnabled } from "./env.js";

const valid = {
  NODE_ENV: "development",
  APP_HOST: "localhost",
  DATABASE_HOST: "localhost",
  DATABASE_PORT: "5432",
  DATABASE_USER: "indiefast",
  DATABASE_PASSWORD: "indiefast",
  DATABASE_NAME: "indiefast",
  REDIS_HOST: "localhost",
  REDIS_PORT: "6379",
  REDIS_PASSWORD: "indiefast",
  S3_HOST: "localhost",
  S3_PORT: "9000",
  S3_ACCESS_KEY: "indiefast",
  S3_SECRET_KEY: "indiefastindiefast",
  S3_BUCKET: "indiefast",
  S3_REGION: "us-east-1",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
};

const parts = {
  appHost: "localhost",
  databaseHost: "localhost",
  databasePort: 5432,
  databaseUser: "indiefast",
  databasePassword: "indiefast",
  databaseName: "indiefast",
  redisHost: "localhost",
  redisPort: 6379,
  redisPassword: "indiefast",
  s3Host: "localhost",
  s3Port: 9000,
  s3AccessKey: "indiefast",
  s3SecretKey: "indiefastindiefast",
  s3Bucket: "indiefast",
  s3Region: "us-east-1",
  smtpHost: "localhost",
  smtpPort: 1025,
  smtpUser: undefined,
  smtpPass: undefined,
  emailProvider: "smtp",
  emailFrom: "IndieFast <noreply@indiefast.local>",
  emailApiEnabled: true,
  resendApiKey: undefined,
  sesAccessKeyId: undefined,
  sesSecretAccessKey: undefined,
  sesRegion: undefined,
  adminEmail: "admin@indiefast.local",
  adminPassword: "indiefast-admin",
  authSecret: "dev-auth-secret-change-me",
  googleClientId: undefined,
  googleClientSecret: undefined,
  githubClientId: undefined,
  githubClientSecret: undefined,
};

describe("loadEnv", () => {
  test("fills the local defaults when port and host are omitted", () => {
    expect(loadEnv(valid)).toEqual({
      nodeEnv: "development",
      port: 4000,
      webUrl: "http://localhost:3000",
      ...parts,
    });
  });

  test("coerces a numeric port", () => {
    expect(loadEnv({ ...valid, PORT: "4100" }).port).toBe(4100);
  });

  test("crashes when the port is not a number", () => {
    expect(() => loadEnv({ ...valid, PORT: "nope" })).toThrow(/PORT/);
  });

  test("crashes when the app host is empty", () => {
    expect(() => loadEnv({ ...valid, APP_HOST: "" })).toThrow(/APP_HOST/);
  });

  test("crashes when the web url is not a url", () => {
    expect(() => loadEnv({ ...valid, WEB_URL: "not-a-url" })).toThrow(
      /WEB_URL/,
    );
  });

  test("crashes when the database host is missing", () => {
    const { DATABASE_HOST: _ignored, ...withoutDatabase } = valid;
    expect(() => loadEnv(withoutDatabase)).toThrow(/DATABASE_HOST/);
  });

  test("reads the repo root .env", () => {
    expect(existsSync(envFilePath)).toBe(true);
    expect(envFilePath.endsWith("/.env")).toBe(true);
    expect(envFilePath.includes("/apps/")).toBe(false);
  });

  test("opens the email API in development and closes it otherwise", () => {
    expect(resolveEmailApiEnabled("development", undefined)).toBe(true);
    expect(resolveEmailApiEnabled("production", undefined)).toBe(false);
    expect(resolveEmailApiEnabled("test", undefined)).toBe(false);
    expect(resolveEmailApiEnabled("development", "false")).toBe(false);
    expect(resolveEmailApiEnabled("production", "true")).toBe(true);
  });

  test("crashes when the redis host is missing", () => {
    const { REDIS_HOST: _ignored, ...withoutRedis } = valid;
    expect(() => loadEnv(withoutRedis)).toThrow(/REDIS_HOST/);
  });
});
