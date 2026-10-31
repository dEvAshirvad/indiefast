# 18 — Idempotency

A double-submitted form should not create two users. The HTTP request can arrive twice. The effect must happen once.

## The key is the memory

`src/lib/idempotency.ts` reads and writes one Redis string, `idem:${key}`, holding `{ status, body }` with a TTL. It does not see `req` or `res`. A Redis failure is `AppError` `DATASTORE_UNAVAILABLE` with the message `Redis is unavailable`. The driver error is not attached.

`src/middleware/idempotency.ts` looks at `Idempotency-Key`. No header means the request runs as usual. A stored hit sends that status and body and does not call the handler. A miss lets the handler run, then stores the JSON it sent. The replay is sent before the wrapper is installed, so a replay is not stored again.

There is no in-flight lock. Two requests that overlap can both miss. The tests are sequential. A lock is `SET NX` plus a wait, and it is not this lesson.

`POST /echo` mounts the middleware before validation. Auth will mount the same function on signup. The echo route still goes away then.

## Verify

```sh
pnpm --filter api test
curl -s -X POST localhost:4000/echo \
  -H 'content-type: application/json' \
  -H 'Idempotency-Key: echo-1' \
  -d '{"message":"hi"}'
curl -s -X POST localhost:4000/echo \
  -H 'content-type: application/json' \
  -H 'Idempotency-Key: echo-1' \
  -d '{"message":"other"}'
```

Both responses have `data.message` of `hi`. A `POST` with `{}` and no key is still 422 `VALIDATION`.

## Stop

Auth attaches this middleware to signup. The echo route dies when that POST exists. Lesson 19 caches a GET, and only the paths it is given.
