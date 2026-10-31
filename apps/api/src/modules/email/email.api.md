# Email API

Email is an internal service. This HTTP route exists so a developer can enqueue a template without signing up again. It is mounted only when `EMAIL_API_ENABLED` is true. That flag defaults on in development and off otherwise.

## Endpoints

- `POST /api/email/test` — session required. Body: `{ to, template, url? }`. `template` is `welcome`, `verify`, or `reset`. `url` is required unless the template is `welcome`. Returns `{ queued: true }`. The worker sends the message. This route does not call SMTP.

App OpenAPI includes this path only while the route is mounted. Reference UI: `GET /api/reference`.
