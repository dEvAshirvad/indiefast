# 06 — Web hooks

Same shape as storage. Types, one API function, one hook. The playground is a lab bench.

## What this lesson adds

```
apps/web/src/queries/email.ts
apps/web/src/app/(app)/playground/email/page.tsx
apps/web/src/app/(app)/playground/email/bench.tsx
```

`emailApi.sendTest` POSTs `/api/email/test` and unwraps `response.data.data`. `useSendTestEmail` is the mutation.

`page.tsx` is the only file that decides whether the bench exists. `NEXT_PUBLIC_EMAIL_API_ENABLED=false` closes it. Unset, `next dev` loads `bench.tsx` and `next build` does not. `bench.tsx` is the only file that imports `queries/email.ts`. Nothing else in the app links to this page.

## Verify

```sh
pnpm --filter web check-types
pnpm --filter api dev
pnpm --filter api worker
pnpm --filter web dev
```

Sign in at `http://localhost:3000/playground/auth`, then open `http://localhost:3000/playground/email`. Send welcome. Mailhog at `http://localhost:8025` shows it.

## Stop

`04-email` is done. Next sitting is `05-ship/01-removable-modules.md`.
