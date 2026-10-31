# 05 — Signup

There is no `modules/auth/routes.ts`. Signup is a Better Auth endpoint. This sitting is learning that URL, not writing a controller.

## The endpoint

```
POST /api/auth/sign-up/email
Content-Type: application/json

{ "email": "user@example.com", "password": "password123", "name": "IndieFast User" }
```

The body matches `SignupInput` from `packages/types/auth.ts`. Better Auth hashes the password into `account.password`. The hash never comes back in the JSON.

A session cookie is set. The next request with that cookie is signed in. CORS already allows `WEB_URL` with credentials, which is why lesson 04 of core used the exact origin instead of `*`.

## What you do not add

- A Zod `validateBody` on this path. Better Auth validates it.
- An IndieFast envelope `{ success, data, meta }`. Better Auth's JSON is Better Auth's JSON. The app envelope is for app routes.
- A service function named `signup`. The web hook in lesson 08 posts to this URL.

## Verify

Postgres and the API are up. Then:

```sh
curl -s -c /tmp/indiefast-cookies -H 'content-type: application/json' \
  -d '{"email":"user@example.com","password":"password123","name":"IndieFast User"}' \
  localhost:4000/api/auth/sign-up/email
```

The response includes a `user` and a `session`. A second identical POST is an error — the email is unique. pgAdmin shows one row in `user` and one in `account`.

## Stop

Session read is the next sitting. Keep the cookie file. Lesson 06 uses `-b /tmp/indiefast-cookies`.
