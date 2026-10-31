# 01 — Strip the demo

The Turborepo page is a marketing site for Turborepo. IndieFast does not ship a UI kit, and it does not ship that page.

## Two groups, no styles

The App Router moves to `src/app`, because Next will not keep a second `app/` router. `src/app/(marketing)/page.tsx` is `/` and renders the text `IndieFast`. `src/app/(app)/playground/page.tsx` is `/playground` and renders the text `Playground`. The root layout is `html` and `body`. There is no CSS module and no `next/image`.

`@repo/ui` is gone from `apps/web`. `packages/ui` is gone with it. The font files sit in `apps/web/fonts` and `public/` stays on disk. Nothing imports them. An `app/` directory next to `src/app` is still a router, so the old `app/` folder has to go or `/` is a 404.

## Verify

```sh
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web dev
```

Open `http://localhost:3000/`. The page is the word IndieFast. Open `/playground`. The page is the word Playground.

## Stop

The pages do not call the API yet. Lesson 02 adds the one Axios client.
