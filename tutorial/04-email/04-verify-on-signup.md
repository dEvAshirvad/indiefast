# 04 — Verify on signup

Better Auth owns `POST /api/auth/sign-up/email`. There is no auth-service TODO to remove. The hook is `emailVerification.sendVerificationEmail` in `lib/auth.ts`. Password reset uses `emailAndPassword.sendResetPassword`. Both call `enqueueEmail` and return. They do not call `send()`.

`sendOnSignUp` is true, so a new account queues a verify message. `requireEmailVerification` stays false, so the playground session still exists after signup. The request waits on Redis, not on Mailhog.

## Verify

```sh
docker compose up -d --wait
pnpm --filter api dev
pnpm --filter api worker
```

Sign up from `http://localhost:3000/playground/auth` or:

```sh
curl -s -X POST http://localhost:4000/api/auth/sign-up/email \
  -H 'content-type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"password123"}'
```

The JSON is back before the message appears at `http://localhost:8025`. Sign-in still works.

## Stop

There is no email HTTP route yet. Lesson 05 adds one, and only in dev.
