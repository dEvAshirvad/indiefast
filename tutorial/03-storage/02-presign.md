# 02 — Presign

The API must never see the bytes. It asks MinIO for a URL, and the browser talks to MinIO.

## What this lesson adds

`createStorage` in `src/configs/storage/s3.ts` grows three methods. The `S3Client` stays private.

| Method | Expires | Command |
|---|---|---|
| `presignPut({ key, contentType, contentLength })` | 60s | `PutObject`. Signs `Content-Type` and `Content-Length`. |
| `presignGet({ key, filename })` | 300s | `GetObject`. Signs `response-content-disposition: inline; filename="..."`. |
| `deleteObject({ key })` | — | Missing object is success |

`@aws-sdk/s3-request-presigner` is the one new dependency.

The SDK signs CRC32 checksums by default. MinIO 501s `PutBucketCors` on those headers, and a browser PUT would not send them. The client sets `requestChecksumCalculation: "WHEN_REQUIRED"`.

MinIO also 501s `PutBucketCors` itself. `ensureBucket` still tries it (real S3). A `NotImplemented` is ignored. Compose sets `MINIO_API_CORS_ALLOW_ORIGIN` to `WEB_URL` so a PUT from `http://localhost:3000` is allowed.

## The service

`src/modules/storage/service.ts` is the module. It does not see `req`.

`createUploadIntent` rejects a content type outside `image/jpeg|png|webp|gif` as `BAD_REQUEST` `"Unsupported content type"`, then `sizeBytes > 10485760` as `BAD_REQUEST` `"File too large"`. The basename strips `/` and `\\`. The key is `{ownerId}/{fileId}/{basename}`. Insert, then presign PUT.

`getForOwner` / `deleteForOwner` 404 when the id is missing **or** owned by someone else. Delete the object, then the row, so a DB miss does not leave a live URL.

A row whose PUT never happened is an orphan. This sitting does not HeadObject.

## Verify

```sh
pnpm --filter api test src/configs/storage/s3.test.ts
pnpm --filter api test src/modules/storage/service.test.ts
```

A presigned PUT of five bytes, then GET, returns those bytes. An OPTIONS preflight from `WEB_URL` is 200.

## Stop

No HTTP routes yet. Lesson 03 mounts them on `modulesRouter` behind `requireAuth`.
