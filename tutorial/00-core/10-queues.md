# 10 — Queues

Signup will eventually send mail. The HTTP request must not wait on SMTP. This lesson opens the pipe. It does not send anything.

## A connection is not a worker

`src/configs/queues/bullmq.ts` creates a BullMQ `Queue` named `email`. It opens its own ioredis connection. BullMQ requires `maxRetriesPerRequest: null`, so this connection is not `getRedis().client`. Sharing that client would change the limiter's retry behavior.

`ready()` waits until the queue is connected and its meta hash is written. That hash is the Redis key `bull:email:meta`. It records the BullMQ version. It is not a job. There is no `queue.add` and no `Worker`.

A refused Redis throws `AppError` `DATASTORE_UNAVAILABLE` with the message `Email queue is unavailable`. `index.ts` calls `ready()` after the Redis ping and logs `email queue ready`.

The worker is a separate process. It arrives in the Email chapter and consumes this same queue name.

## Verify

```sh
pnpm --filter api test
```

Waiting and active counts are 0. `getWorkers()` is empty. `bull:email:meta` exists.

```sh
docker compose exec redis redis-cli exists bull:email:meta
```

That prints `1` after the API has booted. Nothing is consumed, because nothing is listening.

## Stop

No job, no worker, no admin API. The paid Jobs module is not this queue. Lesson 11 connects MinIO.
