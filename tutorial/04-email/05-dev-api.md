# 05 — Dev API

Email is an internal service. The HTTP API is a lab tool.

## The flag

`EMAIL_API_ENABLED` defaults true when `NODE_ENV` is `development`, and false otherwise. An explicit `true` or `false` wins. `createModulesRouter({ emailApi })` mounts `modules/email` only when the flag is on. OpenAPI includes `POST /api/email/test` only in that same case.

The route requires a session. The body is `{ to, template, url? }` from `@indiefast/types/email`. It enqueues. It does not call `send()`. There is no email table and no migration.

## Verify

```sh
pnpm --filter api test src/modules/email/routes.test.ts
```

With the API in development, a signed-in `POST /api/email/test` returns `{ queued: true }`. Set `EMAIL_API_ENABLED=false` and that path is 404. The process still boots.

## Stop

The browser cannot call this yet. Lesson 06 adds the hook and the playground.
