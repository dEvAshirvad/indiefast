# 14 — API docs

Auth paths must not be copied into `configs/openapi.ts`. That file is the app contract. Better Auth already generates its own schema because lesson 02 enabled `openAPI()`.

## Two sources, one page

`/api/reference` (Scalar) loads:

1. `/api/openapi.json` — health, root, later Storage and Email.
2. `/api/auth/open-api/generate-schema` — every Better Auth and plugin path.

```ts
apiReference({
  sources: [
    { url: "/api/openapi.json", title: "App API" },
    { url: "/api/auth/open-api/generate-schema", title: "Auth API" },
  ],
});
```

Better Auth also serves a standalone UI at `/api/auth/reference`. Use either. The merged Scalar page is what a frontend engineer opens first.

## The markdown file

```
apps/api/src/modules/auth/auth.api.md
```

A short human index: the core endpoints, the org endpoints, and the two generated URLs. It is not an OpenAPI document. When a plugin version adds a path, the generated schema updates and this file only needs a new bullet if you want the index to match.

There is no `modules/auth/openapi.ts`. Core lesson 06 said each module would export one. Auth does not, because Better Auth is the module.

## Verify

```sh
pnpm --filter api dev
```

Open `http://localhost:4000/api/reference`. The Auth API source lists `sign-up/email`, `sign-in/email`, `sign-out`, `get-session`, and `organization/list`. `GET http://localhost:4000/api/auth/open-api/generate-schema` is JSON.

## Stop

`02-auth` is done. The module shape for a Better Auth-first slice is: shared Zod types, native handler, Drizzle tables, a tiny app-owned repository, guards, hooks, provider, generated docs. Storage repeats the product-route half of that shape, not the Better Auth half. Next sitting is `03-storage/01-model.md`.
