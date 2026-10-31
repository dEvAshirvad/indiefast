# 02 — API client

The browser needs one place that knows the API. A second Axios instance is how a request id, or later a 401, gets forgotten.

## One instance

`src/lib/env.ts` is the only web file that reads `process.env`. `NEXT_PUBLIC_API_URL` defaults to `http://localhost:4000`.

`src/queries/_client.ts` exports `apiClient`. The base URL is that env value. `withCredentials` is true, so a later session cookie is sent. Every request sets `x-request-id` to a new UUID. There is no response interceptor. That arrives when a session exists.

`/playground` is a server component. It calls `apiClient.get("/health")` and prints the JSON.

## Verify

```sh
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter api dev
pnpm --filter web dev
```

Open `http://localhost:3000/playground`. The page includes `"success": true` and `"ok": true`.

## Stop

No React Query yet. The 401 interceptor waits for a session. Lesson 03 wraps this call in `useHealth`.
