# 03 — Errors

A production API has one failure shape. Controllers throw. One middleware writes the JSON. Callers never parse a stack trace, and they never see a database password.

## The envelope

Success:

```json
{
  "success": true,
  "data": { "ok": true },
  "meta": { "requestId": "…" }
}
```

Failure:

```json
{
  "success": false,
  "error": { "code": "INTERNAL", "message": "Boom" },
  "meta": { "requestId": "…" }
}
```

`data` and `error` never appear together. `meta.requestId` is the id from lesson 02. When you have a failing curl and a log line, you match them on that field.

`/health` uses this shape too. A health check that returns a private JSON shape teaches the next route to invent its own.

## Four files, four jobs

**`lib/responder.ts`** attaches `res.ok`, `res.created`, and `res.fail`. Status 200, 201, and the status you pass. It reads `res.locals.requestId` and, if the logger did not run, writes `"unknown"`. It does not decide whether the request succeeded. The caller does.

The methods are added to Express's `Response` in `src/types/express.d.ts`. Route code can call `res.ok(...)` and TypeScript knows it.

**`configs/errors/api-error.ts`** is the `AppError` class. It is an `Error` with two extra fields: `code` and `status`. Throw it when the failure is one you understand.

**`configs/errors/core-errors.ts`** is the catalog of codes this process owns. Today:

| Code | Status | Message |
|---|---|---|
| `INTERNAL` | 500 | Something went wrong |
| `NOT_FOUND` | 404 | Not found |

Auth will get `configs/errors/auth-errors.ts` in the auth chapter. A module does not invent string codes inside a controller.

**`middleware/error-handler.ts`** is the last middleware. It has four parameters. Express only treats a middleware as an error handler when the function takes four arguments, which is why `_next` is there even though we do not call it.

The branch:

- `AppError` — respond with its status, code, and message. Log one warn line with the code and status. The message is safe because we wrote it, and we already know the stack because we threw it on purpose.
- Anything else — respond with `INTERNAL` and the catalog message. Log at error, including the real `err`, so the stack stays in the log. The client receives `Something went wrong`.

If headers were already sent, it logs and returns. Writing a second body would throw inside the error handler.

**`middleware/not-found.ts`** runs after the routes. It forwards an `AppError` with code `NOT_FOUND`. Unknown URLs then use the same envelope. A 404 that returned HTML would mean the envelope was optional.

## `/boom` proves the async path

```ts
app.get("/boom", async () => {
  throw new AppError({
    code: coreErrors.INTERNAL.code,
    status: coreErrors.INTERNAL.status,
    message: "Boom",
  });
});
```

The handler is `async` and it throws. Express 5 catches that rejected promise and passes it to `errorHandler`. Express 4 did not, which is the "unhandled rejection in production" problem from the PRD. We are on Express 5, so there is no wrapper file in this lesson. If a later test shows a promise escaping, we add a wrapper then, because a helper with no failing test is a guess.

`/boom` is registered only when `NODE_ENV` is not `production`. It is a probe for this lesson, not a product route.

## Tests live next to the file

The PRD says tests are co-located. No `__tests__` folder.

- `env.test.ts` proves defaults and the boot crash.
- `api-error.test.ts` proves the class keeps code, status, and message.
- `server-config.test.ts` calls `/health`, `/boom`, and `/missing` through Supertest. The app never listens.
- `error-handler.test.ts` builds a tiny app that throws `new Error("secret db password")`. The response does not contain `secret`. The status is 500 and the code is `INTERNAL`.

That last test is the production rule: unexpected text stays in the log.

## The order inside `createApp`

```ts
app.use(express.json());
app.use(requestLogger);
app.use(responder);
app.get("/health", …);
app.get("/boom", …);      // development and test only
app.use(notFound);
app.use(errorHandler);
```

Logger first, so the id exists. Responder next, so `res.ok` and `res.fail` exist. Routes. Then the 404. The error handler is last, because it has to be downstream of every `next(error)` and every thrown rejection.

Lesson 21 will reorder this list to the full production pipeline. We will not add security or rate limiting in the middle of this file today.

## Verify

```sh
pnpm --filter api test
pnpm --filter api dev
```

```sh
curl -s localhost:4000/health
curl -s localhost:4000/boom
curl -s localhost:4000/missing
```

`/health` is success. `/boom` is 500, code `INTERNAL`, message `Boom`. `/missing` is 404, code `NOT_FOUND`. Each body has a `requestId`, and the server log has the same id.

With the dev server stopped:

```sh
PORT=4001 NODE_ENV=production pnpm --filter api exec tsx src/index.ts
```

```sh
curl -s localhost:4001/boom
```

That response is 404. Production does not mount the probe.

## Stop

You have a process, a request id, and one error language. The browser on port 3000 still cannot call this API. Lesson 04 is the CORS allowlist.
