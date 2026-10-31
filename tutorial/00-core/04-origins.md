# 04 — Origins

A browser page on port 3000 is a different origin from the API on port 4000. The browser blocks that call unless the API names the page in `Access-Control-Allow-Origin`. This lesson is that allowlist.

`curl` is not a browser. It sends no `Origin` header, and it still works. CORS is a browser rule.

## Why the list is config

`src/configs/origins.ts` knows which origins are allowed. Today that is one value, `WEB_URL`, default `http://localhost:3000`. Production sets `WEB_URL` to the real site. The file does not look at `req`.

`src/middleware/cors.ts` is the gate. It reads the `Origin` header and either reflects that origin or rejects the request. It does not decide which sites exist. It asks `isAllowedOrigin`.

## Credentials and the star

`credentials: true` is on. Later, auth will set a session cookie. Browsers refuse cookies when the allow-origin header is `*`. The header has to be the exact origin that called, `http://localhost:3000`, not a wildcard. That is why the list is explicit.

The response also exposes `x-request-id`. Lesson 02 set that header. Without `Access-Control-Expose-Headers`, browser JavaScript cannot read it.

## Three cases

| Request | Result |
|---|---|
| No `Origin` header | The route runs. `curl` and server-to-server calls. |
| `Origin: http://localhost:3000` | 200, and the allow-origin header echoes that origin. |
| Any other `Origin` | 403, code `ORIGIN_NOT_ALLOWED`, and no allow-origin header. |

A preflight is the browser's `OPTIONS` question before a real call. From the web origin it answers 204 and names the same origin. A foreign preflight is the same 403.

The 403 uses the error envelope from lesson 03. `cors` is mounted after the logger and the responder:

```ts
app.use(requestLogger);
app.use(responder);
app.use(corsPolicy);
```

The logger stamps `requestId`. The responder attaches `res.fail`. Then CORS can reject through the error handler and the body still matches every other failure.

## Verify

```sh
pnpm --filter api test
pnpm --filter api dev
```

```sh
curl -s -D - -o /dev/null -H 'Origin: http://localhost:3000' localhost:4000/health
curl -s -D - -H 'Origin: http://evil.example' localhost:4000/health
curl -s -D - -o /dev/null -X OPTIONS \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: GET' \
  localhost:4000/health
```

The first response carries `access-control-allow-origin: http://localhost:3000` and `access-control-allow-credentials: true`. The second is 403, code `ORIGIN_NOT_ALLOWED`. The third is 204.

## Stop

The browser is allowed to call. Nothing limits how often it calls. Lesson 05 is the rate limit. The store is memory for now. Redis replaces that store in lesson 09.
