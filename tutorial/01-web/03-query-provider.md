# 03 — Query provider

A page that fetches in the server component cannot refetch, and Auth will need the same three layers on every module. This lesson puts those layers on health, which is too small to hide a mistake.

## Types, then the call, then the hook

`src/queries/health.ts` is in that order. `HealthData` is `{ ok: true }`. `HealthEnvelope` is the API envelope around it. `healthApi.get` calls the shared Axios client and returns `response.data`. `useHealth` is `useQuery` with the key `["health"]`.

`src/providers/query-provider.tsx` holds one `QueryClient` in state and renders `QueryClientProvider`. `src/providers/index.tsx` is `Providers`, which renders that provider. The root layout wraps every page in `Providers`.

`/playground` is a client component. While the query is pending it says `Loading health`. Then it prints the envelope. A failed query prints the error message instead of a blank page.

## Verify

```sh
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter api dev
pnpm --filter web dev
```

Open `http://localhost:3000/playground`. After `Loading health`, the page includes `"success": true` and `"ok": true`. Reload. `requestId` changes.

## Stop

Auth copies this file's shape. There is no auth hook yet.
