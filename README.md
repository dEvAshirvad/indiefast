# IndieFast

IndieFast is a backend starter for an engineer who wants to ship an MVP without rebuilding the same plumbing. You get an Express API, Postgres, Redis, object storage, and a transactional email worker. You bring the UI.

The open pack includes three modules:

- **Auth.** Better Auth at `/api/auth/*`, with organizations. The API does not wrap those routes.
- **Storage.** Upload intents against MinIO or S3, with an idempotency key and an audit row.
- **Email.** Signup enqueues a verification message. A separate worker sends it.

Node is `>=24`. The API process clusters on a multicore machine: one core stays a single process, and two or more cores start at least four workers.

MIT licensed. Use it in commercial products.

## Start

```sh
npx create-indiefast my-app
cd my-app
cp .env.example .env
pnpm install
pnpm dev
```

From a clone of this repo, skip `npx` and start at `cp .env.example .env`.

`pnpm dev` brings Compose up, migrates, then starts the API, the email worker, and the web app.

Open:

- Web: http://localhost:3000
- API reference: http://localhost:4000/api/reference
- MinIO: http://localhost:9001
- Mailhog: http://localhost:8025

The MinIO login `indiefast` / `indiefastindiefast` is the local Compose default from `.env.example`. It is not a production credential.

Sign-in stays open before the verification link is clicked.

```sh
pnpm db:migrate
pnpm db:seed
pnpm --filter api test
pnpm lint
```

`pnpm db:seed` creates `admin@indiefast.local` through Better Auth and sets `role` to `admin`. `pnpm --filter api db:backup` writes a Postgres dump. It does not include MinIO or Redis.

## What was measured

One Apple M2, 8 CPUs, local Compose. Full tables and the raw tool output are in [the load report](docs/engineering/load-report.md). ShipFast and the T3 stack were not part of that run.

| Check | Result |
| --- | --- |
| Shared rate limit, 1 process and 8 workers | 60 allowed, 10 rejected. The cap did not become 480. |
| 20 welcome emails | 20 accepted, 20 arrived in Mailhog. |
| SIGTERM to the cluster primary | Exit 0 in 7.2 seconds. Budget is 10 seconds. |
| Cached `GET /health`, 50 connections, 10 seconds | One process: 19,928 req/s, p99 5 ms. Eight workers: 13,527 req/s, p99 17 ms. |

Eight workers were slower on that cached read. Extra processes are not a speedup when the handler never blocks.

Rerun it yourself with Compose already up and nothing listening on port 4000:

```sh
pnpm --filter api load
```

That command rewrites the report from a new run. It is not part of CI.
