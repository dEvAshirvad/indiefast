# 05 — CLI

The scaffold stops moving here. `create-indiefast` copies this repo. It does not generate a second architecture.

## What it copies

`packages/create-indiefast/bin.js` copies the repo into the directory you name. It skips `node_modules`, `.git`, `.next`, `.turbo`, `graphify-out`, `.env`, and the Compose data directories under `docker/`. It keeps `.env.example` and `docker/pgadmin/`. It writes `apps/web/public/logo.svg` and `logo-mark.svg`.

Run it from this repo:

```sh
node packages/create-indiefast/bin.js --self-check
node packages/create-indiefast/bin.js ../my-saas
```

The self-check asserts the skip rules. Publishing to npm, so that `npx create-indiefast@latest` works, waits until this repo is the one you want copied.

## Stop

The course ends. Pagination still waits for a list endpoint that needs it.
