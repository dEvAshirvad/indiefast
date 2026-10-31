# 13 — Serializer and audit

Better Auth's JSON is Better Auth's problem. IndieFast JSON is ours. The serializer is how a password column cannot reach `res.ok`. Audit is how an app-owned route leaves a row behind.

## What this lesson adds

```
apps/api/src/lib/serializer.ts
apps/api/src/middleware/audit-trail.ts
```

`serializeUser` takes a record that might include `password` and returns `{ id, email, name, role }`. `getRequestSession` already calls it. That is why `req.user` never has a hash.

`auditTrail(action)` is middleware. If `req.user.id` is set, it writes one `auth_audit_trail` row through `authRepository.writeAuditEvent`, then `next`. No user, no row — it does not try to audit anonymous traffic.

## Where it mounts

Signup and login are Better Auth. This middleware is not wrapped around `toNodeHandler`. Putting Express middleware on `/api/auth/*` would fight the handler that owns that tree.

Mount it on IndieFast routes that already passed `requireAuth`:

```ts
app.post("/api/something", requireAuth, auditTrail("something.create"), handler);
```

The PRD line about "one row for signup and login" assumed a custom controller. The hard reset deleted that controller. Audit follows the user onto product routes instead of trying to intercept Better Auth.

## Verify

```sh
pnpm --filter api check-types
pnpm --filter api lint
```

`serializeUser({ id, email, name: "A", role: "user", password: "secret" })` has no `password` key. Call it from a scratch test or by reading `auth-session.ts` — the helper is the one place that mapping lives.

## Stop

Docs are generated, not handwritten as OpenAPI. Lesson 14 points Scalar at Better Auth's schema.
