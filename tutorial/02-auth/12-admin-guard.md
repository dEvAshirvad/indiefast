# 12 — Admin guard

Organization roles (`owner`, `admin`, `member`) belong to the plugin. `user.role` is IndieFast's own flag for app routes the plugin does not own. This sitting is that second check.

## What this lesson adds

```
apps/api/src/middleware/require-admin.ts
```

It assumes `requireAuth` already ran. No `req.user` → 401 `UNAUTHORIZED`. `req.user.role !== "admin"` → 403 `FORBIDDEN`. Otherwise `next`.

Mount it on an IndieFast route, after `requireAuth`:

```ts
app.get("/api/admin/something", requireAuth, requireAdmin, handler);
```

Do not mount it on `/api/auth/*`. Better Auth never calls this function.

## Two different "admin"s

| Question | Answer |
|---|---|
| Can this person manage org members? | Organization plugin. `member.role`. |
| Can this person hit an IndieFast admin route? | `user.role === "admin"`. This middleware. |

Storage and Email do not need this file. It exists so the first admin-only route does not invent a third way to read `req.user`.

Nothing in `modulesRouter` uses it yet. That is fine. A guard without a caller is cheaper than a caller without a guard.

## Verify

```sh
pnpm --filter api check-types
pnpm --filter api lint
```

## Stop

The password hash still must not leak through any IndieFast JSON. Lesson 13 is that DTO, and the audit row for app-owned routes.
