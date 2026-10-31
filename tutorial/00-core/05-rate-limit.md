# 05 — Rate limit

A browser origin is allowed. A script from that origin can still hit the API a thousand times a second. This lesson is a budget.

## Why config owns the numbers

`src/configs/rate-limit.ts` knows the window, the max, and the skip list. It does not count.

`src/middleware/rate-limit.ts` counts. It uses `express-rate-limit` and the default memory store. Over the max, it throws `AppError` `RATE_LIMITED` (429) so the envelope from lesson 03 stays.

Lesson 09 will point the store at Redis. The policy file does not change shape. That is why the numbers do not live inside the middleware.

## The skip list

```ts
skipPaths: ["/health", "/", "/api/reference", "/api/openapi.json"]
```

Probes and the docs page do not spend the budget. Lesson 06 will open Scalar a lot. If `/api/reference` shared the 60/min cap, you would 429 yourself while reading the spec.

`/boom` is not skipped. A probe that throws is still a request.

## The key

The key is `req.ip`. We do not read `X-Forwarded-For` yet. Trusting that header without a proxy config is a spoof. `validate.xForwardedForHeader` is off so a test request does not crash the limiter. Lesson 14 can turn proxy trust on when Helmet lands.

No user id. There is no session.

Default policy: 60 requests in 60 seconds.

## Where it sits

```ts
app.use(corsPolicy);
app.use(rateLimiter);
```

After CORS. A foreign origin is already 403. It should not consume the budget.

After the logger and the responder. The 429 still has a request id and the error envelope.

## Verify

```sh
pnpm --filter api test
```

The unit test builds a tiny app with `max: 2`. Request 3 is 429, code `RATE_LIMITED`. `/health` on `createApp()` stays 200 after five calls.

## Stop

No Redis. No per-route Auth limits. One default policy.
