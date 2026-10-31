# 01 — Server setup

The Turborepo demo gave you two Next.js apps and a shared button kit. IndieFast is not that. This lesson deletes the extra app and boots an API process you can call with `curl`.

`apps/web` stays. It still renders the Turborepo demo, and it still imports `packages/ui`. We touch it when the API has something worth calling from a browser.

## Why this is its own lesson

A monorepo has two kinds of projects:

- An **app** is a process. `apps/web` is the website. `apps/api` is the HTTP server.
- A **package** is code that apps import. It does not listen on a port. `packages/typescript-config` is a package.

`pnpm-workspace.yaml` says both `apps/*` and `packages/*` are workspaces. Turbo runs the `dev` script of every app that has one. Deleting `apps/docs` means `pnpm dev` no longer starts a second Next.js app on port 3001.

## What this lesson adds

```
apps/api/
  package.json
  tsconfig.json
  biome.json
  vitest.config.ts
  src/index.ts
  src/configs/env.ts
  src/configs/server-config.ts
```

`apps/docs` is gone.

`pnpm-workspace.yaml` allows the `esbuild` install script. `tsx` (the dev runner) and Vitest both compile TypeScript with esbuild. pnpm 11 blocks dependency install scripts until the workspace names them.

## Lint and format

The API uses [Biome](https://biomejs.dev), not ESLint and not Prettier. One config, `apps/api/biome.json`. `pnpm --filter api lint` is `biome check .`. Format is `biome check --write .`.

Two rules that matter here:

- `style/noProcessEnv` is an error. Only `src/configs/env.ts` may read `process.env`. That file is the override.
- `suspicious/noConsole` is a warning. Logs go through Pino.

`apps/web` still uses the Turborepo ESLint + Prettier setup. Root Prettier ignores `apps/api`. The web chapter is when Biome covers the browser app too.

## Two files, two jobs

`src/configs/server-config.ts` exports `createApp()`. It builds an Express app and returns it. It does not listen.

`src/index.ts` is the process entry. It is the only file that calls `listen`.

Tests import `createApp()` and pass it to Supertest. They never open port 4000. If `listen` lived inside `createApp()`, every test would try to bind the real port.

```ts
const app = createApp();

app.listen(env.port, () => {
  logger.info(
    { port: env.port, url: `http://${env.appHost}:${env.port}` },
    "api listening",
  );
});
```

The logger line is lesson 02. The split between "build" and "listen" is this lesson.

## Env is validated at import

`src/configs/env.ts` reads `NODE_ENV`, `PORT`, `APP_HOST`, and `WEB_URL` with Zod, then renames them to `nodeEnv`, `port`, `appHost`, and `webUrl`. The rest of the API uses the camelCase names. The shouting names stay at the process boundary, which is the only place they exist. `WEB_URL` stays a full origin. The listen log builds `http://${appHost}:${port}` at the call.

The repo root holds `.env`. `env.ts` loads it with `process.loadEnvFile` when the file exists. A missing file is fine: the defaults below still boot the API. `.env.example` is the committed copy of the keys. `.env` is gitignored.

Keys already set in the shell win. The file does not overwrite them. Vitest sets `NODE_ENV=test` before import, so a `NODE_ENV=development` line in `.env` does not leak into tests.

Missing values have local defaults:

| Variable | Default |
|---|---|
| `NODE_ENV` | `development` |
| `PORT` | `4000` |
| `APP_HOST` | `localhost` |
| `WEB_URL` | `http://localhost:3000` |

A wrong value crashes the process before `listen`. `PORT=nope` is a string, Zod coerces it, `Number("nope")` is `NaN`, and `loadEnv` throws `Invalid environment` with `PORT` in the message. You find out at boot, not on the first request.

`loadEnv(source)` takes the object it should read. The app passes `process.env`. Tests pass a plain object, so they can prove the crash without changing your shell.

The module also does `export const env = loadEnv()`. Importing it validates the real environment once. Later configs import `env` instead of reading `process.env` themselves.

## The `.js` at the end of imports

`apps/api/tsconfig.json` extends the shared base, which sets `"module": "NodeNext"`. Node ESM resolves the path you write. TypeScript does not rewrite it. So a file named `env.ts` is imported as `./env.js`.

`tsx` and Vitest map that `.js` path back to the `.ts` file. When you see `.js` inside a `.ts` import, that is Node's rule, and it is correct.

## `/health`

`createApp()` registers `GET /health`. After lesson 03 the body is the success envelope, not a bare `{ ok: true }`. The route's job is unchanged: it is the proof the process is up.

```ts
app.get("/health", (_req, res) => {
  res.ok({ ok: true });
});
```

`express.json()` is mounted here too. Nothing sends a JSON body yet. It is on the app so the first POST lesson does not fail because the body was never parsed.

## Verify

From the repo root:

```sh
pnpm --filter api test
pnpm --filter api check-types
pnpm --filter api lint
pnpm --filter api dev
```

In another terminal:

```sh
curl -s localhost:4000/health
```

You should see `"success": true` and `"ok": true`.

Then stop the server and prove the crash:

```sh
PORT=nope pnpm --filter api exec tsx src/index.ts
```

The process exits, and the message names `PORT`.

## Stop

The process boots and refuses a bad environment. It does not yet tell you which request it handled. That is lesson 02.
