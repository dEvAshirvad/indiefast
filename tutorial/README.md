# IndieFast, taught one lesson at a time

This folder is the course. The code in `apps/` and `packages/` is the starter pack. Read a lesson, look at the files it names, run the verify commands, then stop.

One lesson is one sitting. The next lesson starts only after you can explain the previous one.

## The four layers

Every file in `apps/api/src` belongs to one layer.

| Layer | Folder | It knows | It must not |
|---|---|---|---|
| Config | `configs/` | Settings and clients: env, logger, error codes, and later the database | Do work for a request |
| Lib | `lib/` | Plain helpers | See `req` or `res`, or own a route |
| Middleware | `middleware/` | One job in the form `(req, res, next)` | Call the database or know a product feature |
| Module | `modules/<name>/` | One product slice. Auth is Better Auth-native (model, repository, docs). Storage and Email add routes | Invent a second auth engine |

`index.ts` is the process. It is the only file that calls `listen`.

## How the lessons are named

```
tutorial/
  00-core/     the API process
  01-web/      the browser talking to that process
  02-auth/
  03-storage/
  04-email/
  05-ship/
```

Files are numbered. `01-server-setup.md` comes before `02-logger.md`.

## Where you are

The Turborepo itself is already initialized. These lessons replace the demo `apps/docs` app with a real API process that can refuse a flood, show its contract, reach Postgres, Redis, MinIO, and an email queue, and shut down without leaving a connection behind.

- [01 — Server setup](00-core/01-server-setup.md)
- [02 — Logger](00-core/02-logger.md)
- [03 — Errors](00-core/03-errors.md)
- [04 — Origins](00-core/04-origins.md)
- [05 — Rate limit](00-core/05-rate-limit.md)
- [06 — OpenAPI](00-core/06-openapi.md)
- [07 — Docker](00-core/07-docker.md)
- [08 — Postgres](00-core/08-postgres.md)
- [09 — Redis](00-core/09-redis.md)
- [10 — Queues](00-core/10-queues.md)
- [11 — Storage client](00-core/11-storage-client.md)
- [12 — Shutdown](00-core/12-shutdown.md)
- [13 — Request context](00-core/13-request-context.md)
- [14 — Security](00-core/14-security.md)
- [15 — Validation](00-core/15-validation.md)
- [16 — Timeout and retry](00-core/16-timeout-and-retry.md)
- [17 — Circuit breaker](00-core/17-circuit-breaker.md)
- [18 — Idempotency](00-core/18-idempotency.md)
- [19 — Cache](00-core/19-cache.md)
- [20 — Metrics](00-core/20-metrics.md)
- [21 — Pipeline](00-core/21-pipeline.md)

### 01-web

- [01 — Strip the demo](01-web/01-strip-the-demo.md)
- [02 — API client](01-web/02-api-client.md)
- [03 — Query provider](01-web/03-query-provider.md)
- [04 — UI hooks](01-web/04-ui-hooks.md)

### 02-auth

Better Auth owns `/api/auth/*`. IndieFast keeps types, Drizzle tables, guards, hooks, and generated docs.

- [01 — Shared types](02-auth/01-shared-types.md)
- [02 — Better Auth](02-auth/02-better-auth.md)
- [03 — Model](02-auth/03-model.md)
- [04 — Repository](02-auth/04-repository.md)
- [05 — Signup](02-auth/05-signup.md)
- [06 — Session](02-auth/06-session.md)
- [07 — Sign-in and logout](02-auth/07-signin-logout.md)
- [08 — Web hooks](02-auth/08-web-hooks.md)
- [09 — Auth provider](02-auth/09-auth-provider.md)
- [10 — Social](02-auth/10-social.md)
- [11 — Organizations](02-auth/11-orgs.md)
- [12 — Admin guard](02-auth/12-admin-guard.md)
- [13 — Serializer and audit](02-auth/13-serializer-and-audit.md)
- [14 — API docs](02-auth/14-api-doc.md)

### 03-storage

The API authorizes. MinIO carries the bytes. Files are user-owned.

- [01 — Model](03-storage/01-model.md)
- [02 — Presign](03-storage/02-presign.md)
- [03 — Routes](03-storage/03-routes.md)
- [04 — Web hooks](03-storage/04-web-hooks.md)

### 04-email

Signup returns before mail exists. The API enqueues. A worker sends.

- [01 — Providers](04-email/01-providers.md)
- [02 — Templates](04-email/02-templates.md)
- [03 — Worker](04-email/03-worker.md)
- [04 — Verify on signup](04-email/04-verify-on-signup.md)
- [05 — Dev API](04-email/05-dev-api.md)
- [06 — Web hooks](04-email/06-web-hooks.md)

Next sitting: `05-ship` is the list below. The email chapter is in the tree.

The API and the web app lint and format with [Biome](https://biomejs.dev). `noProcessEnv` is an error everywhere except each app's env module. `engines.node` stays `>=24`.

### 05-ship

Make the repo match the promise. No new product behavior.

- [01 — Removable modules](05-ship/01-removable-modules.md)
- [02 — Scripts](05-ship/02-scripts.md)
- [03 — README](05-ship/03-readme.md)
- [04 — Tooling](05-ship/04-tooling.md)
- [05 — CLI](05-ship/05-cli.md)

## The rest of the map

**05-ship / CLI** — `packages/create-indiefast` copies this repo. `scripts/prove.mjs` is the performance gate.

Pagination still waits for a list endpoint that needs it. Serializer and audit arrived in `02-auth/13`.
