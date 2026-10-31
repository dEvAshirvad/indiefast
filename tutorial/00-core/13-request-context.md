# 13 — Request context

The request id is already on the response. A function that does not see `req` or `res` cannot read it. Passing the id through every call is how it gets dropped.

## One store for this request

`src/lib/request-context.ts` is an `AsyncLocalStorage`. It does not import Express. `runWithRequestId` stores the id for the callback and for every `await` inside it. `getRequestId()` returns that id, or `undefined` when nothing is running.

`request-logger.ts` still creates the id, sets `res.locals.requestId`, and sets the `x-request-id` header. It then calls `next()` inside the store. The finish log keeps the id in its closure. That callback runs later, outside the store, so it cannot ask `getRequestId()`.

The responder and the error handler read `getRequestId()` first, then `res.locals`, then `"unknown"`. Pino's mixin adds `requestId` only when the store has one. A log line outside a request stays unchanged.

`requestLogger` and the responder sit above `express.json()`, so a body that fails to parse still has an id. The rest of the pipeline order waits for lesson 21.

## Verify

```sh
pnpm --filter api test
pnpm --filter api dev
curl -sD - localhost:4000/boom -o /tmp/boom.json
```

The `x-request-id` header and `meta.requestId` in `/tmp/boom.json` are the same id. The warn log for `Boom` carries it too.

## Stop

Edge filters are lesson 14. Business rules do not go in them.
