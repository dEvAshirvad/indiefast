# 09 — Redis

A restart used to forget the rate-limit count, because the counter lived in the process. This lesson puts the counter in Redis. The numbers in `configs/rate-limit.ts` do not move.

## Why ioredis

`src/configs/db/redis.ts` opens one ioredis client. BullMQ speaks ioredis, so the app does too. One client library, two later users: this limiter, and the queue in lesson 10.

The client is lazy. `createApp()` does not connect. `ping()` connects, expects `PONG`, and on any failure throws `AppError` `DATASTORE_UNAVAILABLE` with the message `Redis is unavailable`. `index.ts` pings after Postgres and logs `redis ping ok`.

`retryStrategy` returns null. A down Redis fails the boot. Reconnect policy arrives with the circuit breaker, not here.

## The store

`createRedisRateLimitStore` lives next to the limiter. `increment` is one Lua script: `INCR`, `PEXPIRE` on the first hit, `PTTL`. Keys are prefixed `rl:`. `localKeys` is false, so a second process sees the same count.

`createRateLimiter(policy, store?)` still defaults to the memory store. The lesson 05 test passes no store, and the third request is still 429 with no Redis involved. The exported `rateLimiter` passes the Redis store. That is the only production change.

## Verify

```sh
pnpm --filter api test
```

`a new Redis store keeps the previous count` is the restart test: two store objects, one Redis key, the second increment is 2.

`REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` are what boot and the live tests use. The lesson 07 default is `localhost:6379`. Vitest follows `.env` for those three.

## Stop

No queue. No session cache. One shared counter.
