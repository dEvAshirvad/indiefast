# 01 — Shared types

Two apps cannot copy a Zod schema and stay honest. The day the browser needs the same signup body as the API, the schema leaves `apps/api` and becomes a package.

## Why a package

`packages/types` is not a module. It has no routes and no database. It is the contract both processes import.

A package appears when a second app needs it. Health never needed this. Auth does.

## What this lesson adds

```
packages/types/
  package.json
  index.ts
  auth.ts
```

`apps/api` and `apps/web` both depend on `@indiefast/types`. The export `./auth` is the file they import.

## Three schemas

`packages/types/auth.ts` holds the three shapes the rest of Auth talks about:

- `signupInputSchema` — email, password (min 8), name.
- `signinInputSchema` — email, password.
- `sessionSchema` — a user (`id`, `email`, `name`, `role`) and a session (`id`, `expiresAt` as an ISO string).

The types `SignupInput`, `SigninInput`, and `Session` are inferred from those schemas. Nobody hand-writes a parallel interface.

Better Auth still owns the HTTP bodies and cookies. These schemas are the IndieFast view of that data — what the web hooks return, and what `req.user` looks like after a guard.

`apps/api/src/modules/auth/types.ts` re-exports those names for the API. It does not define a second copy.

## Verify

```sh
pnpm --filter api check-types
pnpm --filter web check-types
```

Both succeed because both apps resolve `@indiefast/types/auth`.

## Stop

No Better Auth instance yet. Lesson 02 creates it and mounts it.
