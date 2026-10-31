# 08 — Web hooks

The starter pack ships the hook, not the form. This sitting is one file of API functions plus hooks, and an unstyled page that calls them so you can see a cookie round-trip.

## What this lesson adds

```
apps/web/src/queries/auth.ts
apps/web/src/app/(app)/playground/auth/page.tsx
```

`auth.ts` is the same three layers as `health.ts`: types, `authApi`, then hooks.

| Function | Method | Path |
|---|---|---|
| `authApi.signupCredentials` | POST | `/api/auth/sign-up/email` |
| `authApi.signinCredentials` | POST | `/api/auth/sign-in/email` |
| `authApi.logout` | POST | `/api/auth/sign-out` |
| `authApi.session` | GET | `/api/auth/get-session` |

`useSignupCredentials`, `useSigninCredentials`, and `useLogout` are `useMutation`. On success they invalidate `["session"]`. `useSession` is `useQuery` with that key.

The Axios client already sends cookies (`withCredentials: true`). Better Auth's JSON is not the app envelope, so `toSession` maps it onto `Session` from `@indiefast/types/auth`. A missing `role` becomes `"user"`. `expiresAt` becomes an ISO string.

Social and org live in the same file because they share the client. Lessons 10 and 11 explain those two functions. Do not split the file.

## The playground is not a component we ship

`/playground/auth` is a lab bench: three inputs, three buttons, a `<pre>` of `useSession()`. A buyer of this starter pack deletes the page and keeps the hooks.

## Verify

```sh
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter api dev
pnpm --filter web dev
```

Open `http://localhost:3000/playground/auth`. Sign up. The `<pre>` shows a user. Refresh. The user is still there.

## Stop

The session query runs only on this page. Lesson 09 hydrates it for every page and clears it on 401.
