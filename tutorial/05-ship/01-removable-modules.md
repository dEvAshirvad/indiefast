# 01 — Removable modules

A module that cannot be deleted is not a module. Email is the proof. Auth and Storage stay.

## What you remove

On a branch, delete these and only these:

- `apps/api/src/modules/email/`
- `apps/api/src/worker.ts`
- the `emailRouter` mount in `modules/index.ts`
- the `emailOpenApiPaths` spread in `configs/openapi.ts`
- `sendVerificationEmail` and `sendResetPassword` in `lib/auth.ts`
- `apps/web/src/queries/email.ts` and `apps/web/src/app/(app)/playground/email/`

There is no email migration. The `verification` table belongs to Auth.

## Verify

```sh
pnpm --filter api check-types
pnpm --filter api dev
```

`GET /health` still returns the success envelope. Put the files back. Signup enqueues again.

## Stop

Lesson 02 adds the scripts a deploy actually runs. The module stays in the tree.
