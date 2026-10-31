# 04 — Repository

A repository talks to Postgres for one module. Auth's repository does not sign anyone in. Better Auth already does that against the core tables.

## What this lesson adds

```
apps/api/src/modules/auth/repository.ts
```

One function: `writeAuditEvent({ userId, action, metadata })`. It inserts into `auth_audit_trail` with a UUID primary key.

That is the whole file. There is no `findUserByEmail`. There is no `createSession`. Those would be a second auth engine.

## The rule

If the row is a Better Auth table, Better Auth writes it. If the row is IndieFast's (`auth_audit_trail`), this repository writes it.

Lesson 13 is the caller. Until then the function exists so the next sitting does not invent a second insert helper.

## Verify

```sh
pnpm --filter api check-types
pnpm --filter api lint
```

The file typechecks. Nothing in the HTTP path calls it yet.

## Stop

No signup route in this module. Lesson 05 uses Better Auth's native endpoint.
