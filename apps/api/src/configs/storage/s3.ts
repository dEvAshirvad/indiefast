import {
  BucketAlreadyExists,
  BucketAlreadyOwnedByYou,
  type BucketLocationConstraint,
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchBucket,
  NotFound,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../env.js";
import { AppError } from "../errors/api-error.js";
import { coreErrors } from "../errors/core-errors.js";

const deadlineMs = 2_000;

function unavailable(): AppError {
  return new AppError({
    code: coreErrors.DATASTORE_UNAVAILABLE.code,
    status: coreErrors.DATASTORE_UNAVAILABLE.status,
    message: "Storage is unavailable",
  });
}

function isMissingBucket(error: unknown): boolean {
  if (error instanceof NotFound || error instanceof NoSuchBucket) return true;
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const metadata =
    "$metadata" in error &&
    error.$metadata &&
    typeof error.$metadata === "object"
      ? error.$metadata
      : undefined;
  const status =
    metadata && "httpStatusCode" in metadata
      ? metadata.httpStatusCode
      : undefined;
  return status === 404 || name === "NotFound" || name === "NoSuchBucket";
}

function isAlreadyExists(error: unknown): boolean {
  return (
    error instanceof BucketAlreadyOwnedByYou ||
    error instanceof BucketAlreadyExists ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error.name === "BucketAlreadyOwnedByYou" ||
        error.name === "BucketAlreadyExists"))
  );
}

function isNotImplemented(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "NotImplemented"
  );
}

export function createStorage(
  host: string,
  port: number,
  accessKey: string,
  secretKey: string,
  bucket: string,
  region: string,
) {
  const client = new S3Client({
    region,
    endpoint: `http://${host}:${port}`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    // MinIO 501s PutBucketCors (and breaks browser PUT) when the SDK signs CRC32 checksums.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  return {
    async ensureBucket() {
      const abortSignal = AbortSignal.timeout(deadlineMs);
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }), {
          abortSignal,
        });
      } catch (error) {
        if (error instanceof AppError) throw error;
        if (!isMissingBucket(error)) throw unavailable();
        try {
          await client.send(
            new CreateBucketCommand({
              Bucket: bucket,
              ...(region === "us-east-1"
                ? {}
                : {
                    CreateBucketConfiguration: {
                      LocationConstraint: region as BucketLocationConstraint,
                    },
                  }),
            }),
            { abortSignal: AbortSignal.timeout(deadlineMs) },
          );
        } catch (createError) {
          if (createError instanceof AppError) throw createError;
          if (!isAlreadyExists(createError)) throw unavailable();
        }
      }
      try {
        await client.send(
          new PutBucketCorsCommand({
            Bucket: bucket,
            CORSConfiguration: {
              CORSRules: [
                {
                  AllowedOrigins: [env.webUrl],
                  AllowedMethods: ["GET", "PUT", "HEAD"],
                  AllowedHeaders: ["*"],
                  ExposeHeaders: ["ETag", "Content-Length"],
                  MaxAgeSeconds: 300,
                },
              ],
            },
          }),
          { abortSignal: AbortSignal.timeout(deadlineMs) },
        );
      } catch (error) {
        if (error instanceof AppError) throw error;
        // MinIO 501s PutBucketCors. Compose sets MINIO_API_CORS_ALLOW_ORIGIN instead.
        if (isNotImplemented(error)) return;
        throw unavailable();
      }
    },
    async presignPut(input: {
      key: string;
      contentType: string;
      contentLength: number;
    }) {
      try {
        return await getSignedUrl(
          // Duplicate @aws-sdk Client types across packages in this workspace.
          client as never,
          new PutObjectCommand({
            Bucket: bucket,
            Key: input.key,
            ContentType: input.contentType,
            ContentLength: input.contentLength,
          }),
          { expiresIn: 60 },
        );
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw unavailable();
      }
    },
    async presignGet(input: { key: string; filename: string }) {
      try {
        return await getSignedUrl(
          client as never,
          new GetObjectCommand({
            Bucket: bucket,
            Key: input.key,
            ResponseContentDisposition: `inline; filename="${input.filename.replace(/["\\\r\n]/g, "_")}"`,
          }),
          { expiresIn: 300 },
        );
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw unavailable();
      }
    },
    async deleteObject(input: { key: string }) {
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: input.key,
          }),
          { abortSignal: AbortSignal.timeout(deadlineMs) },
        );
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw unavailable();
      }
    },
    destroy() {
      client.destroy();
    },
  };
}

let singleton: ReturnType<typeof createStorage> | undefined;

export function getStorage() {
  singleton ??= createStorage(
    env.s3Host,
    env.s3Port,
    env.s3AccessKey,
    env.s3SecretKey,
    env.s3Bucket,
    env.s3Region,
  );
  return singleton;
}
