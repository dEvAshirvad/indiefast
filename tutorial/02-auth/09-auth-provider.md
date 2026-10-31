# 09 — Auth provider

A page that forgets the session on navigation is not a session. The provider holds it, and the Axios interceptor is how a 401 from any later module logs the browser out.

## What this lesson adds

```
apps/web/src/providers/auth-provider.tsx
```

One edit in `src/providers/index.tsx`: `AuthProvider` wraps the children, inside `QueryProvider`, because it calls `useSession` and `useQueryClient`.

## What it does

`useSession` loads the cookie. When that query resolves, the provider copies the value into React state so `useAuth().session` is readable without every button subscribing to the query.

The response interceptor watches for HTTP 401. On 401 it sets the session to `null` and invalidates `["session"]`. Lesson 02 of web left this interceptor out on purpose. There was no session to clear.

`useSignupCredentials` already invalidates `["session"]`. The provider does not call signup. Invalidation is the hook's job. Clearing on 401 is the client's job. Those are different moments.

## Verify

```sh
pnpm --filter web check-types
pnpm --filter web lint
```

Sign in on `/playground/auth`. Open `/playground`. Come back. The `<pre>` still has the user. Sign out. It is `null`.

## Stop

Google and GitHub are still unused. Lesson 10 adds the hook that builds the redirect URL. The live redirect waits on keys in `.env`.
