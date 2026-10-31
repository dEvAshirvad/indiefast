# 15 — Validation

A bad body should fail once, at the edge, in the same envelope as every other error. The service should never see a payload that did not match the schema.

## One middleware, one temporary route

`src/middleware/zod-validate.ts` exports `validateBody(schema)`. It runs `safeParse` on `req.body`. Failure calls `next` with `AppError` `VALIDATION` (422). The message is the Zod issues joined as `path: message`, or `body: message` when the issue has no path. Success replaces `req.body` with the parsed value, so unknown keys are gone and defaults are applied.

`POST /echo` lives in `server-config.ts`, in every environment. The schema sits beside the route: `{ message: string }` with at least one character. A comment marks it for deletion when Auth has a real POST. It moves to `packages/types` when Web needs the same schema.

A body that is not JSON never reaches the schema. `express.json()` throws a `SyntaxError`. The error handler answers that as 422 `VALIDATION` with the message `Validation failed`. The response does not include the parser error.

## Verify

```sh
pnpm --filter api test
curl -s -X POST localhost:4000/echo -H 'content-type: application/json' \
  -d '{"message":"hi","nope":true}'
curl -s -X POST localhost:4000/echo -H 'content-type: application/json' -d '{}'
curl -s -X POST localhost:4000/echo -H 'content-type: application/json' -d '{'
```

The first response is 200 and `data` is `{ "message": "hi" }`. The other two are 422 `VALIDATION`.

## Stop

The echo route dies when Auth has a real POST. Lesson 16 is the deadline helper. It deletes the inline timeout in the queue client.
