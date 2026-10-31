# 11 — Storage client

The API knows `S3_HOST` and still has not asked MinIO if the bucket is there. This lesson opens one client, creates the bucket when it is missing, and stops. There is no upload route.

## The client knows the bucket, not the user

`src/configs/storage/s3.ts` builds an S3 client pointed at `http://${S3_HOST}:${S3_PORT}` with path-style addressing. MinIO is not AWS, so the client does not use virtual-hosted bucket DNS.

`ensureBucket()` sends `HeadBucket`. A 404 creates the bucket. `us-east-1` omits a location constraint, because MinIO rejects one for that region. `BucketAlreadyOwnedByYou` and `BucketAlreadyExists` count as success, so a second boot is quiet. Any other failure, including a refused connection, throws `AppError` `DATASTORE_UNAVAILABLE` (503) with the message `Storage is unavailable`. The driver error is not attached.

`createApp()` does not call `ensureBucket()`. HTTP tests stay hermetic. `index.ts` calls it after the email queue is ready, logs `storage bucket ready` with the bucket name, then listens.

## Verify

```sh
docker compose up -d --wait
pnpm --filter api test
pnpm --filter api dev
```

The log line before `api listening` is `storage bucket ready`. Open `http://localhost:9001` and sign in as `indiefast` / `indiefastindiefast`. The `indiefast` bucket is there.

Stop MinIO, start the API again, and the process exits 1. The log is `DATASTORE_UNAVAILABLE` and `Storage is unavailable`.

## Stop

No upload route. No presigned URL. The Storage module will know users. This client only knows the endpoint, the keys, and the bucket. Lesson 12 closes the pool on `SIGTERM`.
