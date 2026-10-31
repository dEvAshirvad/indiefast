# 01 — Providers

Signup must not wait on a mail vendor. This lesson is the outbound call. Nothing enqueues yet.

## One function

`configs/email/send.ts` exports `send({ to, subject, html, text })`. The module calls that. It does not import Resend, SES, or nodemailer.

`EMAIL_PROVIDER` picks the arm. The default is `smtp`, which is the Mailhog container already in Compose (`SMTP_HOST`, `SMTP_PORT`). `ses` and `resend` are the other arms. Each outbound HTTP call goes through `withTimeout` and the circuit breaker from `lib/circuit-breaker.ts`. A missing key throws `AppError` `EMAIL_NOT_CONFIGURED` when `send()` runs, not at boot.

| File | It knows |
|---|---|
| `configs/email/smtp.ts` | Mailhog |
| `configs/email/ses.ts` | SES credentials |
| `configs/email/resend.ts` | A Resend API key |
| `configs/email/send.ts` | Which arm is selected |

## Verify

```sh
pnpm --filter api test src/configs/email/send.test.ts
```

The SMTP test uses nodemailer's JSON transport. Mailhog stays closed.

## Stop

No template, no worker, no signup hook. Lesson 02 writes the three messages.
