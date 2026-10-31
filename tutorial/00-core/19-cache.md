# 19 — Cache

Health can be cached. A session must not be. The difference is a list of paths, not a comment someone will forget.

## An allowlist, not a guess

`src/lib/cache.ts` reads and writes `cache:${key}` in Redis. It does not see `req`. A Redis error is `AppError` `DATASTORE_UNAVAILABLE` with the message `Redis is unavailable`.

`src/middleware/cache.ts` takes the allowlist. It stores a response only for `GET` whose path is in that list, and only when the status is 200 and the body is a success envelope. It stores `data`, not the envelope. A hit calls `res.ok(data)`, so `meta.requestId` belongs to this request. A path that is not on the list is never stored. If Redis is down, the request still runs. A cache is an optimization. Health should not die with it.

`createApp` passes `["/health"]`. `/api/auth/get-session` is not on that list. Auth does not get added to it.

## Verify

```sh
pnpm --filter api test
```

Two `GET /health` calls return the same `data`. Their `meta.requestId` values differ, and each one matches that response's `x-request-id`.

## Stop

Session routes stay off the allowlist. Lesson 20 counts requests. It does not cache them.
