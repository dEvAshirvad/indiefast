# 03 — Worker

The HTTP process enqueues. A second process sends. They share Redis and the queue name `email` from lesson 10.

## A separate process

`src/worker.ts` is a BullMQ `Worker`. It calls `deliverEmail`, which renders the template and calls `send()`. The API never imports `send()`.

Jobs use 3 attempts and exponential backoff, set in `emailJobOptions`. A refused SMTP call throws, and BullMQ retries.

`pnpm --filter api worker` runs it. Leave the API on `pnpm --filter api dev` in the other terminal.

A crash after the provider accepts the message and before the job is acked can send twice. The verify token still works once. That ceiling is the comment at the top of `worker.ts`.

## Verify

```sh
pnpm --filter api test src/modules/email/deliver.test.ts
```

The deliver test passes a fake `send`. To see Mailhog, enqueue from lesson 05 and watch `http://localhost:8025`.

## Stop

Signup still does not enqueue. Lesson 04 hooks Better Auth.
