# 08 — Postgres

The API knows `DATABASE_HOST` and still has not opened a socket. This lesson opens one pool, asks Postgres if it is there, and leaves the schema empty.

## Why one pool

`src/configs/db/postgres.ts` builds a `pg` pool with `max: 10` and a Drizzle client on top of it. Drizzle writes SQL. It is not a second database.

`ping()` borrows one client, runs `select 1`, and releases the client in `finally`. A refused connection, including a failure inside `connect()`, throws `AppError` `DATASTORE_UNAVAILABLE` (503) with the message `Postgres is unavailable`. The driver error is not attached. Boot must not dump a stack for a database that is simply down.

`createApp()` does not call `ping()`. HTTP tests stay hermetic. `index.ts` is the process, so `index.ts` pings, logs `postgres ping ok`, then listens. On `AppError` it logs `boot failed` with the code and the message, then exits 1.

## Migrations

`src/configs/db/migrations/meta/_journal.json` is a Drizzle journal with no entries. There is no SQL file yet. Auth writes the first one.

`scripts/migrate.ts` is the runner. It calls `migratePostgres` and closes the pool. The package script is `pnpm --filter api db:migrate`. The root Turbo script waits for the ship chapter.

## Verify

```sh
docker compose up -d --wait
pnpm --filter api test
pnpm --filter api dev
```

The log line before `api listening` is `postgres ping ok`. `curl -s localhost:4000/health` is still the lesson 03 envelope.

Stop Postgres, start the API again, and the process exits 1. The log is `DATASTORE_UNAVAILABLE` and `Postgres is unavailable`, not a `pg` stack.

## Stop

No Redis client. No query from a route. Lesson 12 closes the pool on `SIGTERM`.
