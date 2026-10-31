# IndieFast

Copy `.env.example` to `.env`, start the local cluster, migrate, and run the apps.

```sh
cp .env.example .env
pnpm install
pnpm dev
```

`pnpm dev` brings Compose up, migrates, then starts the API, the email worker, and the web app. Node is `>=24` because the API and the toolchain are written for that runtime. Lowering the pin is a separate compatibility project, not a change to the architecture.

Open:

- Web: http://localhost:3000
- API reference: http://localhost:4000/api/reference
- MinIO: http://localhost:9001 (`indiefast` / `indiefastindiefast`)
- Mailhog: http://localhost:8025

Auth and organizations are Better Auth routes at `/api/auth/*`. The API does not wrap them. Signup enqueues a verification email. The worker sends it. Sign-in stays open before the link is clicked.

```sh
pnpm db:migrate
pnpm db:seed
pnpm --filter api test
pnpm lint
```

`pnpm db:seed` creates `admin@indiefast.local` through Better Auth and sets `role` to `admin`. `pnpm --filter api db:backup` writes a Postgres dump. It does not include MinIO or Redis.
