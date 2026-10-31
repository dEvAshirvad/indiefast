# 07 — Docker

Lesson 08 cannot ping a database that is not a known URL. This lesson is the datacenter. Four containers. No client code. The API still does not open a socket to Postgres.

## Why Compose is config for the machine

`docker-compose.yml` at the repo root is the local cluster:

| Service | Image | Host port |
|---|---|---|
| Postgres | `postgres:16` | 5432 |
| Redis | `redis:7` | 6379 |
| MinIO API | `minio/minio` | 9000 |
| MinIO console | same | 9001 |
| Mailhog SMTP | `mailhog/mailhog` | 1025 |
| Mailhog UI | same | 8025 |

Named volumes hold the data. Postgres and Redis have healthchecks so `docker compose up -d --wait` can return. MinIO and Mailhog do not: their images do not ship a reliable probe, and this lesson does not need them healthy to teach a host and port.

## Env learns the parts

`.env.example` and `.env` gain host, port, user, and password. `src/configs/env.ts` requires the names. No silent default on a host. A missing `DATABASE_HOST` crashes at boot with that name in the message, the same way a bad `PORT` did in lesson 01.

The process still does not connect. A host in env is not a pool. Lesson 08 opens the pool and runs `select 1`. Call sites build a URL from these parts when a client needs one. `WEB_URL` is the exception, because CORS needs the exact origin.

| Variable | Local value |
|---|---|
| `DATABASE_HOST` | `localhost` |
| `DATABASE_PORT` | `5432` |
| `DATABASE_USER` | `indiefast` |
| `DATABASE_PASSWORD` | `indiefast` |
| `DATABASE_NAME` | `indiefast` |
| `REDIS_HOST` | `localhost` |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | `indiefast` |
| `S3_HOST` | `localhost` |
| `S3_PORT` | `9000` |
| `S3_ACCESS_KEY` | `indiefast` |
| `S3_SECRET_KEY` | `indiefastindiefast` |
| `S3_BUCKET` | `indiefast` |
| `S3_REGION` | `us-east-1` |
| `SMTP_HOST` | `localhost` |
| `SMTP_PORT` | `1025` |

MinIO wants a password of at least eight characters. `indiefastindiefast` matches `MINIO_ROOT_PASSWORD` in Compose. Change one, change both.

Local Compose publishes those ports on `127.0.0.1` only. `docker-compose.vps.yml` publishes none of them. Vitest follows `.env` for the host and port. The crash tests pass an object that omits `DATABASE_HOST` or `REDIS_HOST`.

## Verify

```sh
pnpm --filter api test
docker compose up -d --wait
```

Then open:

- `http://localhost:9001` — MinIO console. User `indiefast`, password `indiefastindiefast`.
- `http://localhost:8025` — Mailpit. Empty inbox.

```sh
pnpm --filter api dev
curl -s localhost:4000/health
```

The health response is the same as lesson 03. The API has the URLs. It has not used them.

## Stop

No Drizzle. No ioredis. No S3 client. No `select 1`. That is lesson 08.
