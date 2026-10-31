# Auth API

IndieFast is Better Auth-first. Auth and organization APIs are served natively
by Better Auth under `/api/auth/*` via `toNodeHandler(auth)`.

## Core Endpoints

- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session`
- `GET /api/auth/sign-in/social?provider=...&callbackURL=...`

## Organization Plugin Endpoints

- `POST /api/auth/organization/create`
- `GET /api/auth/organization/list`
- `GET /api/auth/organization/list-members`
- `POST /api/auth/organization/set-active`
- `GET /api/auth/organization/get-organization`
- `GET /api/auth/organization/get-full-organization`

For the complete, plugin-generated schema and endpoint details:

- JSON schema: `GET /api/auth/open-api/generate-schema`
- API reference UI: `GET /api/auth/reference`
