# 02 — Logger

`console.log` has no request id. When two signups fail at the same time, you cannot tell which line belongs to which person. This lesson gives every request one id, and writes one structured line when the response finishes.

## Why a logger is config

`src/configs/logger/pino.ts` creates the Pino instance. It knows the log level and which fields to redact. It does not know about Express.

`src/middleware/request-logger.ts` is the Express piece. It runs once per request, stamps an id, and writes the line. It does not decide the log level.

That split is the layer rule. The next time you want a different level, you edit the config. The middleware stays.

## The level

| `NODE_ENV` | Level | What you see |
|---|---|---|
| `development` | `debug` | The request line, and anything we log at info or debug |
| `production` | `info` | The request line. Debug noise stays off |
| `test` | `silent` | Nothing. Vitest output stays readable |

The line itself is JSON. That is the production shape. A pretty printer can be piped on later. We are not adding that dependency in this lesson, because the thing to learn is the fields, not the colors.

`redact` lists `req.headers.authorization` and `req.headers.cookie`. This middleware does not log those headers. The list is on the logger so a later lesson cannot accidentally print a session cookie by logging the request object.

## One id, two places

On the way in, the middleware:

1. Generates a UUID.
2. Stores it on `res.locals.requestId`.
3. Sets the `x-request-id` response header.

`res.locals` is Express's bag for data that belongs to this response. Lesson 03 reads the same field when it builds the JSON. Lesson 13 will move the id into `AsyncLocalStorage` so code that never sees `res` can still read it. Until then, `res.locals` is enough, and it is visible.

On the way out, `res.on("finish")` runs after the status and body are sent. The line looks like this:

```json
{
  "level": 30,
  "requestId": "…",
  "method": "GET",
  "path": "/health",
  "status": 200,
  "durationMs": 2,
  "msg": "request"
}
```

Pino also adds `time`, `pid`, and `hostname` on its own. `level` 30 means info. `durationMs` is the time from the start of the middleware to `finish`, in milliseconds. The fields this lesson owns are `requestId`, `method`, `path`, `status`, and `durationMs`.

The middleware is mounted in `createApp()` before the routes:

```ts
app.use(requestLogger);
```

A route that ran first would send its response with no id.

## Where the type of `requestId` lives

`src/types/express.d.ts` adds `requestId` to Express's `Locals` interface. That file is type-level config for the process. It is not a runtime helper, so it does not go in `lib/`.

Without that declaration, `res.locals.requestId` would be a type error. `strict` is on, and `noUncheckedIndexedAccess` is on, in the shared tsconfig. A field you did not declare does not exist.

## Verify

Start the API if it is not running:

```sh
pnpm --filter api dev
```

```sh
curl -s -D - localhost:4000/health -o /dev/null
```

The response headers include `x-request-id`. The server terminal prints one JSON line for that request, and the `requestId` in the line matches the header.

Call it twice. You get two ids. That is the whole point.

## Stop

You can see the request. You still cannot trust the shape of a failure. A thrown error would be Express's HTML page, and `/health` would be a different shape from that page. Lesson 03 makes every response one envelope.
