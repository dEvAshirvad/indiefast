# 14 — Security

These are edge filters. They run before a route and they do not know what the product does.

## Headers, duplicate params, and bad keys

`src/middleware/security.ts` is three middlewares: `helmet`, `hpp`, and `compression`. Helmet sets the usual browser headers and removes `X-Powered-By`. `hpp` keeps the last value when a query key is repeated, so `?a=1&a=2` is `"2"`, not an array. Express 5 rebuilds `req.query` on every read, so the file pins the parsed object before `hpp` mutates it. Compression gzips large responses. `/health` is small, so it stays plain JSON.

`src/middleware/sanitize.ts` walks `req.body`, `req.query`, and `req.params`. A key named `__proto__`, `constructor`, or `prototype`, or a string that contains a null byte, is `AppError` `BAD_REQUEST` (400) with the message `Bad request`. A normal body is left as it arrived.

`src/middleware/serve-emoji-favicon.ts` answers `GET /favicon.ico` with an SVG bolt. `createApp` mounts it only when `NODE_ENV` is not production, so a browser tab in dev stops asking for a missing icon.

They are mounted after `express.json()` and before the routes. The final pipeline order is lesson 21.

## Verify

```sh
pnpm --filter api test
pnpm --filter api dev
curl -sI localhost:4000/health | head
curl -s localhost:4000/favicon.ico
curl -s -X POST localhost:4000/health -H 'content-type: application/json' \
  -d '{"constructor":{"prototype":{"admin":true}}}'
```

`/health` is still 200 and includes `x-content-type-options: nosniff`. The favicon is the bolt. The `constructor` body is 400 `BAD_REQUEST`. `Origin: http://localhost:3000` is still allowed.

## Stop

No business rules in these files. Lesson 15 checks the body against a schema.
