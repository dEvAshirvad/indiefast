# 01 — Model

Auth stored people. Storage stores a pointer to bytes that live in MinIO. The API never holds the file. The row is the contract: who owns it, and which key in the bucket it is.

## What this lesson adds

```
apps/api/src/modules/storage/model.ts
apps/api/src/modules/storage/repository.ts
apps/api/src/configs/db/migrations/0001_storage.sql
```

One journal entry, tag `0001_storage`. Same hand-written SQL as Auth. No drizzle-kit.

## The table

`file` is user-owned, not org-owned.

| Column | Why |
|---|---|
| `id` | UUID the API hands the browser |
| `owner_id` | `user.id`. `ON DELETE CASCADE` |
| `bucket_key` | `{ownerId}/{fileId}/{basename}` in MinIO. Unique. |
| `filename` | The name the uploader typed, not the key |
| `content_type` | Signed onto the PUT |
| `size_bytes` | Cap is 10 MiB. Signed as `Content-Length` |
| `created_at` | When the intent was created, not when MinIO got the bytes |

There is no `status`. A row whose PUT never happened is an orphan. Lesson 02 does not HeadObject to clean it up.

`fileRepository` is `insert`, `findById`, `deleteById`. It does not talk to MinIO.

## Verify

```sh
docker compose up -d --wait
pnpm --filter api db:migrate
pnpm --filter api test src/modules/storage/repository.test.ts
```

pgAdmin shows `file` next to `user`.

## Stop

No presigned URL. Lesson 02 asks MinIO for a PUT and a GET. The API still does not see the bytes.
