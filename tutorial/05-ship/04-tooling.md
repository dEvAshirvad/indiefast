# 04 — Tooling

The API already uses Biome. The web app was the last ESLint project, and the root still ran Prettier.

## One formatter

`apps/web/biome.json` matches the API: double quotes, spaces, `noProcessEnv` off only in `src/lib/env.ts`. `lint` and `format` in `apps/web` call Biome.

`packages/eslint-config` is deleted. So is `apps/web/eslint.config.js`. Root `format` is `turbo run format`. Prettier is gone.

`engines.node` stays `>=24`. This lesson does not audit Node 20.

## Verify

```sh
pnpm --filter web lint
pnpm --filter api lint
```

Both are Biome. Nothing imports `eslint`.

## Stop

The test gate in `scripts/prove.mjs` runs before `create-indiefast`. The CLI copies a tree that has already been measured.
