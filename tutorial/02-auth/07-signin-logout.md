# 07 — Sign-in and logout

Same rule as signup. These are Better Auth URLs. IndieFast does not reimplement them.

## The endpoints

```
POST /api/auth/sign-in/email
{ "email": "user@example.com", "password": "password123" }

POST /api/auth/sign-out
```

Sign-in sets the session cookie. Sign-out clears it. The body of sign-in matches `SigninInput`.

A wrong password is Better Auth's error, not `AppError`. The error handler in lesson 03 still catches thrown `AppError`s from `requireAuth`. It does not rewrite Better Auth's own JSON.

## Why this is its own sitting

Signup creates a row. Sign-in proves you still know the password. Logout is the cookie dying. Teaching all three in one file hides that they are three different Better Auth operations, each with its own path.

Idempotency from lesson 18 is for IndieFast POSTs (`/echo`, and later Storage). Do not wrap these Better Auth paths in that middleware. Better Auth owns retries and duplicate sign-up.

## Verify

```sh
curl -s -c /tmp/indiefast-cookies -H 'content-type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}' \
  localhost:4000/api/auth/sign-in/email

curl -s -b /tmp/indiefast-cookies localhost:4000/api/auth/get-session

curl -s -b /tmp/indiefast-cookies -c /tmp/indiefast-cookies \
  -X POST localhost:4000/api/auth/sign-out

curl -s -b /tmp/indiefast-cookies localhost:4000/api/auth/get-session
```

The last call is `null`.

## Stop

The browser still has no hook. Lesson 08 copies the health query file's shape onto these URLs.
