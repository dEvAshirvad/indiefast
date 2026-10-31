# 10 — Social

OAuth is still Better Auth. The hook does not post a password. It builds the URL Better Auth expects, and the browser navigates there.

## The URL

```
GET /api/auth/sign-in/social?provider=google&callbackURL=...
GET /api/auth/sign-in/social?provider=github&callbackURL=...
```

`callbackURL` is `window.location.origin`. After Google or GitHub, Better Auth sends the browser back to the app that started the flow.

`authApi.signinSocial` returns `{ url }`. `useSigninSocial` is a mutation around that. The playground does not have to render a Google button. The hook existing is the lesson.

## Keys are optional

`lib/auth.ts` only registers a provider when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (or the GitHub pair) are set. Empty strings in `.env.example` mean the route and the hook still exist. Hitting the URL without keys is Better Auth's error, not a crash at boot.

That is the point of a starter pack: the shape is there. Credentials wait until a project has a Google console client.

## Verify

```sh
pnpm --filter web check-types
pnpm --filter api check-types
```

With keys unset, `curl -s -o /dev/null -w "%{http_code}\n" "localhost:4000/api/auth/sign-in/social?provider=google&callbackURL=http://localhost:3000"` is not a process crash. Fill the four env vars, restart the API, and the same URL becomes a redirect.

## Stop

Organizations are a plugin, not a second module. Lesson 11 turns that plugin on in the browser.
