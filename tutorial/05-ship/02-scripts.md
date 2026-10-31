# 02 — Scripts

The architecture can boot. A second person still needs one command.

## What this lesson adds

`scripts/migrate.ts` was already the Drizzle runner. This lesson adds:

```
apps/api/scripts/seed-admin.ts
apps/api/scripts/backup-data.sh
```

`seed-admin.ts` calls Better Auth `signUpEmail`, then sets `role` to `admin`. It does not hash the password itself. The address is `ADMIN_EMAIL` (default `admin@indiefast.local`).

`backup-data.sh` is `pg_dump` of Postgres. MinIO and Redis are not in the file.

Root `pnpm dev` is `turbo run dev worker`. The API `dev` script stays `tsx watch src/index.ts`. The worker script is separate, so the HTTP process is not buried inside it.

## Verify

```sh
docker compose up -d --wait
pnpm db:seed
pnpm --filter api db:backup /tmp/indiefast.sql
pnpm dev
```

Adminer shows the admin user with `role` `admin`. The SQL file is a dump. The dev terminal shows the API, the worker, and the web app.

## Stop

The root README is still the Turborepo page. Lesson 03 replaces it.
