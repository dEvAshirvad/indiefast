# 06 — Session

Two consumers need the same session: the browser, and any IndieFast route that is not Better Auth. Better Auth already serves the first. This lesson is the second.

## Native read

```
GET /api/auth/get-session
```

With the cookie from lesson 05, the body is the user and session. Without it, the body is `null` and the status is still 200. "Not signed in" is not a 401 on this path.

## What this lesson adds

```
apps/api/src/lib/auth-session.ts
apps/api/src/middleware/require-auth.ts
apps/api/src/types/express.d.ts
```

`getRequestSession(headers)` calls `auth.api.getSession` with `fromNodeHeaders`. It returns the shared `Session` type, or `null`. `serializeUser` is how the password field, if it were ever present, stays out of `req.user`.

`requireAuth` is middleware. No session → `AppError` `UNAUTHORIZED` 401. Otherwise it sets `req.user` and `req.session` and calls `next`.

`express.d.ts` is the type of those two fields. They come from `Session` in `@indiefast/types/auth`. Product routes that sit behind this guard can read `req.user.id` without talking to Better Auth again.

`lib/` still does not see `req` / `res`. The helper takes raw Node headers. The middleware is the only file that touches Express.

## Verify

```sh
curl -s -b /tmp/indiefast-cookies localhost:4000/api/auth/get-session
curl -s localhost:4000/api/auth/get-session
```

The first prints a user. The second prints `null`.

```sh
pnpm --filter api check-types
pnpm --filter api lint
```

Nothing in `modulesRouter` uses `requireAuth` yet. Storage will. That is the point of writing the guard before the first protected product route.

## Stop

Sign-in and sign-out are still Better Auth URLs. Lesson 07 names them.
