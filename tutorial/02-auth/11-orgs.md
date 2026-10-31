# 11 — Organizations

Do not build `/api/org`. The organization plugin already served those routes when lesson 02 added `organization()` to the plugin list.

## Plugin URLs

```
POST /api/auth/organization/create
GET  /api/auth/organization/list
GET  /api/auth/organization/list-members
POST /api/auth/organization/set-active
GET  /api/auth/organization/get-organization
GET  /api/auth/organization/get-full-organization
```

`auth.api.md` lists these so a human can find them. The generated schema in lesson 14 is the source of truth when a plugin version adds a path.

The tables are `organization`, `member`, and `invitation` from lesson 03. `session.activeOrganizationId` is how "the current org" survives a refresh.

## The hook

`authApi.org` GETs `/api/auth/organization/list`. `useOrg` is `useQuery` with key `["org"]`. The `Organization` type in `queries/auth.ts` is the list-row shape (`id`, `name`, `slug`, `logo`, `role`). It is local to the hook file because Better Auth owns the wire format. `packages/types/auth.ts` stays the session contract, not a copy of every plugin payload.

No `modules/auth/service.ts` creates an org. A future product feature that needs "the current org id" reads it from the session, or calls `auth.api` the way `getRequestSession` does.

## Verify

Sign in, then:

```sh
curl -s -b /tmp/indiefast-cookies -H 'content-type: application/json' \
  -d '{"name":"Acme","slug":"acme"}' \
  localhost:4000/api/auth/organization/create

curl -s -b /tmp/indiefast-cookies localhost:4000/api/auth/organization/list
```

The list includes `acme`. pgAdmin shows one `organization` row and one `member` row.

## Stop

`requireAdmin` is not an org role check. Lesson 12 is for IndieFast routes that are not the plugin.
