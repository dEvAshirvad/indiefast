# 02 — Templates

The provider sends a message. It does not know what a verify email says. Templates are plain functions. They never see `req` or `res`.

## Three messages

`modules/email/templates.ts` exports welcome, verify, and reset. Each returns `{ subject, html, text }`. Verify and reset take the URL Better Auth built. HTML escapes that URL. `renderEmail` reads a job and returns the message `send()` accepts. A verify job without a URL throws.

There is still no queue add, and the HTTP process still does not call `send()`.

## Verify

```sh
pnpm --filter api test src/modules/email/templates.test.ts
```

## Stop

Lesson 03 starts the worker that consumes the `email` queue from lesson 10. The API still only has the connection.
