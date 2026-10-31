# 03 — README

The repo should tell a new person the five-minute path. The Turborepo marketing README does not.

## The path

Root `README.md` is: copy `.env.example`, `pnpm install`, `pnpm dev`, then open `:3000`, `:4000/api/reference`, `:9001`, and `:8025`.

The mail UI is Mailhog, which is the container in `docker-compose.yml`. The VPS file still runs Mailpit under the service name `mailpit`. Local and VPS are different files. The README names the local one.

`engines.node` stays `>=24`. The README says so in one sentence. The pin is about the runtime this repo is written for.

## Verify

Read `README.md` from the top. A person who has Node 24 and Docker can follow it without opening `tutorial/`.

## Stop

`apps/web` still lints with ESLint. Lesson 04 moves it to Biome.
