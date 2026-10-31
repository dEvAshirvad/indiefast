# 17 — Circuit breaker

One slow outbound call must not pin every request. Timeout and retry are not enough: after the dependency is clearly down, the next call should fail before it waits.

## One client, three helpers

`src/lib/circuit-breaker.ts` wraps an async function in Opossum. Defaults are a 10 second timeout, a 50% error threshold, a volume of 5, and a 30 second reset. `src/lib/http-client.ts` is the caller. `get(url)` runs `fetch` inside `withTimeout`, that function inside the breaker, and `breaker.fire` inside `retry`.

The breaker's own timeout is 100ms longer than `timeoutMs`, so a slow response is recorded as `TimeoutError` rather than Opossum's timer. Defaults are `timeoutMs` 1000, `attempts` 2, and `baseMs` 50. Neither file imports Express. `index.ts` does not call this client. Email and OAuth will.

## Verify

```sh
pnpm --filter api exec vitest run src/lib/http-client.test.ts
pnpm --filter api test
```

The test points `createHttpClient` at a local server that sleeps for 300ms, with a 50ms timeout and a volume of 2. The first two calls reject `TimeoutError`. The third rejects in under 30ms, and the message says the breaker is open. The action is not called again.

## Stop

No Email caller. No OAuth caller. Next sitting is idempotency: the same `Idempotency-Key` returns the stored response and does not run the handler twice.
