# 02 — Better Auth

IndieFast does not wrap signup, login, logout, or session in a custom controller. Better Auth is the HTTP auth server. This lesson creates the instance and mounts it.

## The rule

`src/lib/auth.ts` is config plus a library. It never sees `req` or `res`. The Express app in `src/configs/server-config.ts` is the only file that hands it a request.

## What this lesson adds

```
apps/api/src/lib/auth.ts
```

One edit in `src/configs/server-config.ts`:

```ts
app.all("/api/auth/*splat", toNodeHandler(auth));
```

Express 5 names the catch-all `*splat`. Everything under `/api/auth` is Better Auth's. Product routes stay on `modulesRouter` at `/api`.

## The instance

`betterAuth({ ... })` gets:

- `secret` from `env.authSecret` (`AUTH_SECRET`, min 16 chars).
- `baseURL` built as `http://${appHost}:${port}/api/auth`.
- `trustedOrigins: [env.webUrl]` so the cookie is valid for the Next app.
- `drizzleAdapter` on the Postgres client from lesson 08, `provider: "pg"`, schema from `modules/auth/model`.
- `emailAndPassword.enabled: true`.
- `socialProviders` only for Google or GitHub when both id and secret are set. Empty keys mean those providers are omitted, not misconfigured.
- plugins: `openAPI()` and `organization()`.

There is no custom `signUp` function. There is no `/api/auth/signup` IndieFast route. The plugin list is the feature list.

## Verify

```sh
pnpm --filter api check-types
pnpm --filter api lint
docker compose up -d --wait
pnpm --filter api db:migrate
pnpm --filter api dev
```

`curl -s -o /dev/null -w "%{http_code}\n" localhost:4000/api/auth/get-session` prints `200`. The body is `null` until someone signs in. A path Better Auth does not know is still Better Auth's 404, not the app `notFound` handler.

## Stop

The tables do not exist until lesson 03 writes the Drizzle schema and the migration. The mount above will fail against an empty database. Run this sitting after 03 if you are walking the repo from a cold Postgres.
