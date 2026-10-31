# 04 — Web hooks

The starter pack ships the hook, not a dropzone. `useUploadFile` asks the API for a PUT URL, then the browser PUTs the `File` to MinIO.

## What this lesson adds

```
apps/web/src/queries/storage.ts
apps/web/src/app/(app)/playground/storage/page.tsx
```

Copy `health.ts`, not `auth.ts`. Storage uses the app envelope. Unwrap `response.data.data`.

| Function | Path |
|---|---|
| `storageApi.createUploadIntent` | `POST /api/storage/uploads` |
| `storageApi.getFile` | `GET /api/storage/files/:id` |
| `storageApi.deleteFile` | `DELETE /api/storage/files/:id` |

`useUploadFile` is a mutation that takes a `File`. It refuses a type outside `allowedUploadContentTypes` before the POST, then posts the intent, then `fetch(uploadUrl, { method: "PUT", headers: { "Content-Type", "Content-Length" }, body: file, mode: "cors" })`. A failed PUT throws. Success invalidates `["file", id]`.

`useFile(id)` is `useQuery` with that key, `enabled` when `id` is set.

`useDeleteFile` invalidates the same key.

The playground is a lab bench: a sign-in hint, a file input (`accept` the same MIME list), a `next/image` preview on `downloadUrl` (MinIO is in `images.remotePatterns`; `dangerouslyAllowLocalIP` is on because MinIO is loopback), a download link, a delete button, a `<pre>`. Delete the page when you design a real UI.

## Verify

```sh
pnpm --filter web check-types
pnpm --filter web lint
docker compose up -d --wait
pnpm --filter api db:migrate
pnpm --filter api dev
pnpm --filter web dev
```

Open `http://localhost:3000/playground/auth`, sign in, then `http://localhost:3000/playground/storage`. Upload a small file. MinIO console (`http://localhost:9001`) shows `{userId}/{uuid}/...`. Refresh. GET still works. Delete removes the object and the row.

## Stop

`03-storage` is done. Next sitting is `04-email/01-providers.md`. A signup still does not send mail.
