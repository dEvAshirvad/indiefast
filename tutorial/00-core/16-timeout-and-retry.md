# 16 — Timeout and retry

A deadline and a backoff are ordinary functions. They do not know about Express. The queue client was already waiting on Redis with a private copy of the deadline. That copy is gone.

## Two functions

`src/lib/with-timeout.ts` exports `withTimeout(promise, ms)` and `TimeoutError`. If the promise settles first, the timer is cleared. If it does not, the rejection is `TimeoutError` with the message `Timed out after ${ms}ms`. The timer is unref'd so a forgotten caller does not hold the process open. `TimeoutError` is not an `AppError`.

`src/lib/retry.ts` exports `retry(fn, { attempts, baseMs, sleep })`. After a failure that is not the last one, it waits `baseMs * 2 ** (attempt - 1)`. It does not sleep after the final failure. Tests pass a `sleep` so they do not wait on a clock. The default sleep is `setTimeout`.

`src/configs/queues/bullmq.ts` imports `withTimeout`. The 2000ms deadlines on `waitUntilReady` and `getVersion` are unchanged. A timeout is still not an `AppError`, so `ready()` still throws `DATASTORE_UNAVAILABLE` with the message `Email queue is unavailable`.

## Verify

```sh
pnpm --filter api test
```

## Stop

Nothing outbound calls these yet. Lesson 17 composes them into one HTTP client.
