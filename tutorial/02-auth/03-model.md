# 03 — Model

Better Auth needs tables. Drizzle owns the SQL. This lesson is the schema, not a repository.

## Three files, three owners

```
apps/api/src/modules/auth/model/core.ts
apps/api/src/modules/auth/model/organization-plugin.ts
apps/api/src/modules/auth/model/audit.ts
apps/api/src/modules/auth/model.ts
apps/api/src/configs/db/migrations/0000_auth.sql
```

`model.ts` re-exports all three. `lib/auth.ts` imports that barrel as the adapter schema.

| File | Owner | Tables |
|---|---|---|
| `core.ts` | Better Auth core | `user`, `session`, `account`, `verification` |
| `organization-plugin.ts` | organization plugin | `organization`, `member`, `invitation` |
| `audit.ts` | IndieFast | `auth_audit_trail` |

Do not add columns to core or plugin tables to store product data. A new IndieFast concern gets a new table, the way audit did.

`session.activeOrganizationId` is a plugin field. It lives on the core session table because Better Auth puts it there. That is the exception, not a license to pile product columns onto `user`.

## Why Drizzle, not Better Auth's CLI, wrote the SQL

The adapter is told about these tables. The migration is the committed SQL that creates them. `0000_auth.sql` is the first journal entry. Lesson 08 left the journal empty on purpose.

`user.role` defaults to `"user"`. That column is how lesson 12 tells an admin from everyone else. Better Auth does not need it for email/password. IndieFast does, for app routes that are not the organization plugin.

## Verify

```sh
pnpm --filter api db:migrate
```

In pgAdmin (`http://127.0.0.1:5050`) the `indiefast` database now has `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`, and `auth_audit_trail`.

## Stop

No insert from application code. Lesson 04 is the only repository, and it only writes audit rows. Signups are Better Auth inserting into these tables.
