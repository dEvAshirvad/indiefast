# 06 — OpenAPI

The envelope is a story until it is a contract. This lesson writes the contract by hand and puts Scalar in front of it.

## Why the spec is a config file

`src/configs/openapi.ts` is the OpenAPI 3.1 document. It knows `/health`, `/`, and the success and error envelopes. It does not generate itself from comments. A JSDoc plugin would hide the contract in the routes.

Later each module exports `modules/<name>/openapi.ts`. This file will merge them. Today you register two paths.

`/boom` stays out. It is a probe, not a product.

## Two URLs

| Path | What it is |
|---|---|
| `GET /api/openapi.json` | The document. Machines read this. |
| `GET /api/reference` | Scalar. A browser reads this. |

Scalar is `@scalar/express-api-reference`. It takes `url: "/api/openapi.json"` and renders the HTML. Try-it on `/health` should match `curl localhost:4000/health`.

Both paths are on the rate-limit skip list from lesson 05.

## Shared schemas

`SuccessEnvelope` and `ErrorEnvelope` live under `components.schemas`. The next module copies those names. It does not invent a third wrapper.

`servers[0].url` is `http://${env.appHost}:${env.port}`, built in this file. The spec names the process that serves it.

## Verify

```sh
pnpm --filter api test
pnpm --filter api dev
```

Open `http://localhost:4000/api/reference`. `/health` is in the sidebar. Try it. The body is `{ success: true, data: { ok: true }, meta: { requestId } }`.

```sh
curl -s localhost:4000/api/openapi.json | head
```

## Stop

No module registry. No codegen. No auth padlock on the spec.
