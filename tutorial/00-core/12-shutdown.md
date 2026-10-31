# 12 — Shutdown

A deploy does not ask. It sends `SIGTERM`. Without a handler the process dies and Postgres keeps the pool's connections until they time out.

## Stop accept, finish the request, then close

`src/lib/shutdown.ts` registers one `SIGTERM` listener with `process.once`. The handler stops accepting new connections, drops idle keep-alive sockets, and waits for the request already in flight. Then it closes Postgres, Redis, and the email queue, and destroys the S3 client. A second signal does not close them again.

If that wait lasts longer than 10 seconds, the process exits 1. The timer is unref'd, so a finished shutdown does not hold the process open.

`index.ts` is the only place that listens, so it is the only place that installs the handler. `createApp()` does not.

The pool sets `application_name` to `indiefast`, so you can see those connections and only those. `GET /slow` sleeps 1.5 seconds and then answers. It exists outside production, next to `/boom`, so you can kill the process while a request is still running.

## Verify

```sh
pnpm --filter api test
pnpm --filter api dev
```

In another shell:

```sh
curl -s localhost:4000/slow &
kill "$(lsof -ti :4000)"
```

`kill` sends `SIGTERM`. The curl prints the success envelope, then the API process exits.

```sh
docker compose exec postgres psql -U indiefast -d indiefast -c \
  "select count(*) from pg_stat_activity where application_name = 'indiefast'"
```

That count is 0.

## Stop

No request context yet. The id still lives on `res.locals`. Lesson 13 moves it to `AsyncLocalStorage`.
