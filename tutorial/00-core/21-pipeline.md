# 21 — Pipeline

The lessons were taught in the order that is easy to learn. The process runs in a different order. This lesson adds no behavior. It puts the files in the order a request actually meets them.

## The comment is the map

`src/configs/server-config.ts` mounts middleware in runtime order:

1. Request logger. It creates the id, sets `x-request-id`, and writes the finish line. The finish callback keeps the id in a closure, because it runs outside the request.
2. Security. Helmet, hpp, and compression.
3. Request context. `src/middleware/request-context.ts` calls `runWithRequestId` so the rest of the request can read the id without seeing `req`.
4. Rate limit.
5. Sanitize.
6. Routes.

The error handler is last.

Responder, `express.json()`, and CORS sit in that list because the route handlers need them. Section 8.2 assumes that plumbing. They are not a new idea.

`/boom` still puts the same id in the header and in `meta.requestId`. A foreign origin is still 403. A malformed `/echo` body is still 422.

## Verify

```sh
pnpm --filter api test
pnpm --filter api check-types
pnpm --filter api lint
```

## Stop

The core process is done. It can boot, fail cleanly, reach its datastores, and run this pipeline. Next is the browser.
