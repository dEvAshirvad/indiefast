# 03 — Routes

Storage is the first module that owns Express routes. Auth HTTP is Better Auth. These three paths sit on `modulesRouter` at `/api`.

## What this lesson adds

```
packages/types/storage.ts
apps/api/src/modules/storage/types.ts
apps/api/src/modules/storage/routes.ts
apps/api/src/modules/storage/openapi.ts
apps/api/src/modules/storage/storage.api.md
```

`validateParams(schema)` joins `validateBody` in `src/middleware/zod-validate.ts`. GET and DELETE have no body.

`modules/index.ts` mounts `storageRouter` at `/storage`. `configs/openapi.ts` spreads `storageOpenApiPaths`. That is the merge core lesson 06 promised.

## The three paths

| Method | Path | Middleware |
|---|---|---|
| POST | `/api/storage/uploads` | `requireAuth`, `idempotency()`, `validateBody(uploadIntentSchema)`, `auditTrail("storage.upload")` |
| GET | `/api/storage/files/:id` | `requireAuth`, `validateParams(fileIdParamSchema)` |
| DELETE | `/api/storage/files/:id` | `requireAuth`, `validateParams`, `auditTrail("storage.delete")` |

`uploadIntentSchema`: `filename` 1–255, `contentType` one of `image/jpeg` | `image/png` | `image/webp` | `image/gif` (no SVG, no `application/octet-stream`), `sizeBytes` a positive int capped at 10485760. Declared MIME only — MinIO does not scan the bytes.

`fileIdParamSchema`: `{ id: z.uuid() }`.

POST answers `res.created`. GET `res.ok`. DELETE `res.ok({ ok: true })`. The envelope is the app envelope, not Better Auth JSON.

A missing id and another user's id are both 404 `NOT_FOUND`. No session is 401 from `requireAuth`.

Keep `/echo`. Its tests still prove idempotency and malformed JSON.

## Verify

```sh
pnpm --filter api test src/modules/storage/routes.test.ts
pnpm --filter api test src/middleware/zod-validate.test.ts
pnpm --filter api check-types
pnpm --filter api lint
```

`GET /api/openapi.json` includes `/api/storage/uploads`.

## Stop

The browser still has no hook. Lesson 04 copies the health query file onto these three URLs and PUTs the file to MinIO itself.
