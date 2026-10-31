# 04 — UI hooks

These hooks are generic. They do not know about Auth, and Auth does not wait on them.

## Six files

Each file in `src/hooks` is a client hook and nothing else.

- `useDebounce(value, delayMs)` keeps returning the previous value until `delayMs` has passed since the last change.
- `useMediaQuery(query)` reads `window.matchMedia`. It is `false` until the component has mounted.
- `useMobile()` is `useMediaQuery("(max-width: 768px)")`.
- `useLocalStorage(key, initial)` reads JSON from `localStorage` after mount and writes it back. A corrupt value falls back to `initial`.
- `useClipboard()` copies with `navigator.clipboard.writeText`. `copied` stays true for 1500ms.
- `useIntersection(ref)` observes the node and returns whether it is intersecting.

Nothing in the app imports them yet.

## Verify

```sh
pnpm --filter web check-types
pnpm --filter web lint
```

## Stop

`01-web` is done. Next sitting is `02-auth/01-shared-types.md`. The 401 interceptor arrives with the session.
