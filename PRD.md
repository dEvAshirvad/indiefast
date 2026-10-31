# IndieFast — Open Source Starter Pack PRD

**Version:** 2.0
**Last updated:** October 25, 2026
**Owner:** Ashirvad
**Repo:** `github.com/indiefast/indiefast`
**License:** MIT
**Target launch:** Week 3 of the 8-week IndieFast roadmap (public GitHub release)

---

## 1. One-line pitch

**A production-grade, backend-heavy SaaS Starter Pack for Indian developers who care about customization and performance — bring your own UI.**

---

## 2. What IndieFast (OSS) is

IndieFast OSS is a **Starter Pack**, not a framework and not a UI kit.

Two things live inside it:

- **The Starter Pack** — a production-grade monorepo scaffold with a modular Express backend, Postgres + Drizzle, Redis, MinIO, Docker Compose dev stack, and the core framework (error handling, OpenAPI, circuit breakers, observability, graceful shutdown) every serious SaaS needs.
- **Backend-heavy modules** — vertical slices for common SaaS needs. Each module ships the backend (service, repository, model), the API (routes, controller, validation, openapi), and the frontend plumbing (TanStack Query hooks + Axios client + session wiring + shared Zod schemas) — but **not** the rendered UI components.

**Design is the developer's choice.** Shadcn, Chakra, Mantine, Tailwind UI, or a bespoke in-house system — whatever a buyer's brand needs. IndieFast ships the brain, they ship the face. Our hooks and typed API client are the clean interface between what we built and what they design.

Three modules at v1 inside the OSS Starter Pack:
- **Auth** — Better Auth backend + full auth API + `useSignupCredentials`, `useSigninCredentials`, `useSigninSocial`, `useLogout`, `useSession`, `useOrg` hooks
- **Storage** — MinIO/S3 backend + upload API + `useUploadFile`, `useFile`, `useDeleteFile` hooks
- **Email** — Resend/SES abstraction + transactional queue + base templates (welcome, verify, reset). API is open in **dev only**, closed in prod via env flag.

The OSS tier **does not include** Payments, Entitlements, AI, Jobs, Admin, Marketing, or the Email payments variant pack. Those live in the Indie Hacker Starter Pack (private repo, lifetime license).

MIT licensed. Use freely, including commercially. Modify, redistribute, resell your own derivative work. No strings.

---

## 3. The problem

Every Indian dev building a serious Node.js SaaS burns the same ~5–6 weeks before writing a single line of product code. The pain is sharper than tutorial blogs admit:

- **Monorepo plumbing done wrong** — Turborepo misconfigured, shared types drifting between frontend and backend, build caches that never hit
- **Error handling scattered** across controllers, no central AppError, async middleware returning unhandled promise rejections in production
- **Validation + types duplicated** — Zod schemas copy-pasted between frontend and backend, drifting on every change
- **No OpenAPI docs** — Postman collections maintained by hand, frontend devs guessing the API shape
- **No request idempotency** — payment webhooks firing twice create duplicate charges
- **No circuit breakers** — one slow external call takes down the whole API
- **No observability** — `console.log` everywhere, no request IDs, impossible to trace a failing request through logs
- **No graceful shutdown** — deploys drop in-flight requests
- **Auth cobbled from NextAuth** — works, but no RBAC, no orgs, no session management, no 2FA story
- **Storage done with raw AWS SDK** — pre-signed URLs reimplemented every project
- **Email handled by direct SMTP** — no queue, no retry, no bounce handling, blocking the request thread
- **Frontend hitting backend ad hoc** — fetch calls scattered through components, no shared Axios instance, no typed API client, no TanStack Query cache strategy

Existing options fail the Indian developer:

| Tool | Problem |
|---|---|
| ShipFast / LaunchFast / Supastarter | Paywall from day 1, Stripe-only, Next.js API routes (not production backend), no India flows |
| NestJS / AdonisJS | Opinionated frameworks that lock you in |
| create-t3-app | Great scaffold but no modular architecture, no modules, no observability out of the box |
| shadcn/ui | Perfect copy-paste model but UI-only — no backend, no API, no hooks that know anything about your backend |
| Build it yourself | 5–6 weeks of plumbing before product work starts |

There is no free, backend-heavy, MIT-licensed, modular SaaS Starter Pack built around Indian dev defaults (self-host friendly, no AWS lock-in) that respects the developer's design freedom.

---

## 4. The solution

A **Starter Pack that respects your code and your brand**.

- **Production-grade core framework** — modular Express architecture, AppError, async handler, response envelope, Zod validation, OpenAPI auto-gen, circuit breakers, idempotency, request context, graceful shutdown, Pino logging. Everything a serious SaaS needs before writing a feature.
- **Backend-heavy modules** — Auth, Storage, Email as full vertical slices from DB to typed hook. You get the engine, the API, and the clean interface. You get `useSignupCredentials()`, not `<SignupForm />`.
- **Design is yours** — bring your own UI library. Our hooks and API client don't care what you render.
- **End-to-end typed** — Zod schemas live in `packages/types` and are imported by both backend validation and frontend hooks. Change the backend schema, the frontend hook knows.
- **TanStack Query + Axios** — one Axios instance with interceptors, one QueryClient, one pattern per module (types + api fns + hooks all in one file).
- **Benchmarked** — projected to sustain 8k+ req/sec on a ₹3,000/mo KVM 8 VPS. k6 configs and Grafana screenshots published alongside the launch.
- **Self-host friendly** — Postgres, Redis, MinIO all run in Docker Compose for dev and on a cheap VPS in prod. No AWS lock-in.
- **MIT licensed** — ship side projects, client work, commercial products on it. No strings. No phone-home. No runtime license check. Ever.

The OSS Starter Pack is for learning the architecture, building side projects, and shipping serious non-monetized apps. When a developer is ready to launch a monetizable SaaS with Razorpay + GST invoices + entitlements + admin, they upgrade to the **Indie Hacker Starter Pack** (private repo, lifetime license).

---

## 5. License

**MIT License.**

- Anyone can use IndieFast OSS, including commercially
- Modify freely
- Redistribute (with the MIT notice)
- Build derivative works, including paid ones
- No warranty, no liability

Three explicit non-commitments baked into the brand:
- **No phone-home telemetry.** Not now. Not ever.
- **No runtime license check.** Clone it, use it offline, forever.
- **No DRM, obfuscation, or source protection.** Every line is readable.

Why MIT over AGPL: the brand wins on modules, updates, community, and support — not on legal protection of the open core. AGPL would scare off commercial buyers of the OSS tier and slow adoption. We accept the risk of someone building a competing paid product on our core and compete on execution.

---

## 6. Target users

### Primary — Indian learner / student / fresh dev
A B.Tech student, bootcamp grad, or junior engineer learning full-stack by shipping real projects. Comfortable with Next.js and Node.js basics. Wants a reference architecture they can study and build on. Future buyer of Indie Hacker when they ship their first serious SaaS.

### Secondary — Indian solo dev / indie hacker (pre-revenue)
Building a side project or MVP they're not yet charging for. Wants to skip the plumbing without paying upfront. Will upgrade to Indie Hacker when the project needs payments and entitlements.

### Tertiary — Agency / consultant doing client work
Uses the OSS Starter Pack as the baseline for client projects that don't need the paid modules (internal tools, prototypes, non-SaaS web apps). MIT license means they can bill clients without complication.

### Quaternary — Open-source contributor
Node.js dev who wants to contribute to a serious OSS project, see their name in commits, build credibility. First PRs become case studies on the IndieFast blog.

**Not a target:** Enterprise. Non-dev founders. People who want a no-code / low-code solution.

---

## 7. Scope — v1 (shipped Week 3 of the 8-week roadmap)

### 7.1 Scaffold layout (what `npx create-indiefast@latest` generates)

```
my-saas/
├── apps/
│   ├── api/                                   # Express backend (production-grade)
│   │   ├── public/
│   │   │   ├── logo-light.svg                 # auto-generated from project initials
│   │   │   └── logo-dark.svg
│   │   ├── src/
│   │   │   ├── configs/
│   │   │   │   ├── env.ts                     # Zod-validated env schema
│   │   │   │   ├── server-config.ts           # Express app factory, wired in index.ts
│   │   │   │   ├── origins.ts                 # CORS allowlist
│   │   │   │   ├── rate-limit.ts              # default rate-limit policies
│   │   │   │   ├── openapi.ts                 # Swagger + Scalar config
│   │   │   │   ├── db/
│   │   │   │   │   ├── postgres.ts            # Drizzle client
│   │   │   │   │   ├── redis.ts               # ioredis client
│   │   │   │   │   └── migrations/            # Drizzle migrations (shared across modules)
│   │   │   │   ├── storage/
│   │   │   │   │   └── s3.ts                  # MinIO/S3 client config
│   │   │   │   ├── email/
│   │   │   │   │   ├── resend.ts              # Resend client (dev)
│   │   │   │   │   └── ses.ts                 # SES client (prod)
│   │   │   │   ├── logger/
│   │   │   │   │   └── pino.ts                # Pino config
│   │   │   │   ├── queues/
│   │   │   │   │   └── bullmq.ts              # BullMQ connection (shared)
│   │   │   │   └── errors/
│   │   │   │       ├── api-error.ts           # AppError class
│   │   │   │       ├── auth-errors.ts         # auth-specific error codes
│   │   │   │       └── core-errors.ts         # core error codes catalog
│   │   │   │
│   │   │   ├── lib/                           # Framework-level helpers (no routing)
│   │   │   │   ├── auth.ts                    # Better Auth instance export
│   │   │   │   ├── responder.ts               # res.ok / created / paginated / fail
│   │   │   │   ├── paginator.ts               # cursor + offset helpers
│   │   │   │   ├── serializer.ts              # DTO transformers
│   │   │   │   ├── idempotency.ts             # idempotency helpers
│   │   │   │   ├── circuit-breaker.ts         # Opossum wrapper
│   │   │   │   ├── retry.ts                   # exponential backoff
│   │   │   │   ├── with-timeout.ts            # promise timeout
│   │   │   │   ├── request-context.ts         # AsyncLocalStorage
│   │   │   │   ├── slug.ts                    # slugify
│   │   │   │   ├── cache.ts                   # Redis cache utilities
│   │   │   │   ├── http-client.ts             # outbound HTTP w/ breaker + retry
│   │   │   │   ├── hateoas.ts                 # link builder for responses
│   │   │   │   ├── shutdown.ts                # graceful shutdown
│   │   │   │   └── domain.ts                  # domain/subdomain utilities
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── zod-validate.ts            # request validation
│   │   │   │   ├── require-auth.ts            # session guard
│   │   │   │   ├── require-admin.ts           # role guard
│   │   │   │   ├── error-handler.ts           # global error middleware
│   │   │   │   ├── audit-trail.ts             # action logging
│   │   │   │   ├── cache.ts                   # response caching
│   │   │   │   ├── idempotency.ts             # Idempotency-Key handling
│   │   │   │   ├── request-timeout.ts         # per-route timeout
│   │   │   │   ├── request-logger.ts          # Pino HTTP
│   │   │   │   ├── metrics.ts                 # Prometheus metrics
│   │   │   │   ├── sanitize.ts                # injection guards
│   │   │   │   ├── serve-emoji-favicon.ts     # dev-only favicon
│   │   │   │   └── security.ts                # helmet + hpp + compression bundle
│   │   │   │
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── model.ts               # auth schema barrel
│   │   │   │   │   ├── model/
│   │   │   │   │   │   ├── core.ts            # Better Auth core tables
│   │   │   │   │   │   └── audit.ts           # app-owned audit table
│   │   │   │   │   ├── repository.ts          # app-owned auth-adjacent persistence only
│   │   │   │   │   └── auth.api.md            # Better Auth-first API doc
│   │   │   │   ├── storage/                   # same shape
│   │   │   │   ├── email/                     # same shape (API open in dev, closed in prod via EMAIL_API_ENABLED)
│   │   │   │   └── index.ts                   # module registry (mounts routers)
│   │   │   │
│   │   │   ├── types/
│   │   │   │   ├── global.d.ts                # Express.Request augmentation (user, session, pagination)
│   │   │   │   ├── supertest.d.ts
│   │   │   │   ├── pagination.ts              # shared pagination types
│   │   │   │   └── error.ts                   # error types
│   │   │   │
│   │   │   └── index.ts                       # app entrypoint (bootstrap, listen, shutdown)
│   │   │
│   │   ├── scripts/
│   │   │   ├── backup-data.sh
│   │   │   ├── seed-admin.ts
│   │   │   └── migrate.ts
│   │   ├── logs/                              # Pino file sink (gitignored)
│   │   ├── uploads/                           # local upload buffer (gitignored)
│   │   │   └── temp/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── biome.json
│   │
│   └── web/                                   # Next.js 15 app
│       ├── public/
│       │   ├── logo-light.svg                 # same auto-generated logo as api
│       │   └── logo-dark.svg
│       ├── src/
│       │   ├── app/                           # Next.js App Router
│       │   │   ├── (marketing)/               # public routes
│       │   │   ├── (app)/                     # protected routes
│       │   │   └── layout.tsx                 # providers mounted here
│       │   │
│       │   ├── queries/                       # one file per module: types + api fns + hooks
│       │   │   ├── _client.ts                 # shared Axios instance + interceptors
│       │   │   ├── auth.ts                    # useSignupCredentials, useSigninSocial, useLogout, ...
│       │   │   ├── storage.ts                 # useUploadFile, useFile, useDeleteFile
│       │   │   └── email.ts                   # dev-only hooks
│       │   │
│       │   ├── hooks/                         # cross-cutting UI hooks
│       │   │   ├── use-debounce.ts
│       │   │   ├── use-mobile.ts
│       │   │   ├── use-media-query.ts
│       │   │   ├── use-local-storage.ts
│       │   │   ├── use-clipboard.ts
│       │   │   └── use-intersection.ts
│       │   │
│       │   ├── providers/
│       │   │   ├── query-provider.tsx         # TanStack QueryClientProvider
│       │   │   ├── auth-provider.tsx          # session context, hydration, 401 interceptor
│       │   │   └── index.tsx                  # composed root provider
│       │   │
│       │   └── lib/
│       │       ├── env.ts                     # client env (NEXT_PUBLIC_*)
│       │       └── types.ts
│       │
│       ├── package.json
│       ├── tsconfig.json
│       └── next.config.ts
│
├── packages/                                  # SHARED across projects (not just this one)
│   ├── types/                                 # Zod schemas shared FE ↔ BE
│   │   ├── auth.ts
│   │   ├── storage.ts
│   │   ├── email.ts
│   │   ├── pagination.ts
│   │   └── error.ts
│   └── config/                                # shared tsconfig, biome
│       ├── tsconfig.base.json
│       └── biome.json
│
├── docker-compose.yml                         # Postgres + Redis + MinIO + Mailhog
├── turbo.json
├── package.json                               # pnpm workspace root
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

### 7.2 Rules the scaffold enforces

- **`configs/` = configuration only.** Env, server config, client instances (DB, Redis, S3, email, logger, queues), OpenAPI config, error-code catalogs. No helper functions.
- **`lib/` = framework-level helpers, no routing.** Responder, paginator, serializer, idempotency, circuit breaker, retry, request context, cache, slug, HTTP client, HATEOAS, shutdown. Called by middleware and modules, never owns routes.
- **`middleware/` = Express middleware only.** Everything fits `(req, res, next)`.
- **`modules/<module>/` = complete slice** with router, controller, service, repository, schema (Zod), model (Drizzle), openapi, types, `.api.md` doc. One shape across every module.
- **Email module exposes HTTP API in dev only.** Controlled by `EMAIL_API_ENABLED` env flag. Email is normally an internal service call; the HTTP API exists for dev testing and is closed in production.
- **Tests co-located.** `service.ts` + `service.test.ts` next to each other. No `__tests__` folders.
- **`packages/` is strict:** only common functions, types, and configs reusable across more than one project (OSS, Pro, user's own future projects). Not module code. Not anything project-specific.

### 7.3 Frontend convention (`apps/web/src/queries/<module>.ts`)

Each file has three sections, in order:

```ts
// 1. Types — re-exported from packages/types
import type { SignupInput, Session, OrgMember } from '@indiefast/types/auth';

// 2. API fns — plain Axios calls, typed
export const authApi = {
  signupCredentials: (input: SignupInput) =>
    client.post<{ user: User; session: Session }>('/api/auth/sign-up/email', input),
  signinCredentials: (input: SigninInput) =>
    client.post<{ user: User; session: Session }>('/api/auth/sign-in/email', input),
  signinSocial: (provider: 'google' | 'github') =>
    client.get(`/api/auth/sign-in/social?provider=${provider}`),
  logout: () => client.post('/api/auth/sign-out'),
  session: () => client.get<Session>('/api/auth/get-session'),
  // ...
};

// 3. Hooks — TanStack Query wrappers
export const useSignupCredentials = () =>
  useMutation({ mutationFn: authApi.signupCredentials, onSuccess: ... });
export const useSigninCredentials = () => useMutation({ ... });
export const useSigninSocial = () => useMutation({ ... });
export const useLogout = () => useMutation({ ... });
export const useSession = () => useQuery({ queryKey: ['session'], queryFn: authApi.session });
export const useOrg = () => useQuery({ ... });
```

One file per module. Types first, API fns second, hooks third. Nothing else lives here.

### 7.4 Explicitly out of scope for OSS

Reserved for Indie Hacker (private repo, paid):
- Payments module (Razorpay + GST invoices + customer portal API/hooks)
- Entitlements module (plans + feature flags + usage metering + `useFeature` / `usePlan` / `useLimit` hooks)
- AI module (multi-provider + streaming + token tracking + `useAI` / `useStream` hooks)
- Jobs module (BullMQ queues + scheduled + DLQ + admin API)
- Admin module (users, impersonation, feature flags, metrics API + hooks)
- Marketing module (landing, pricing, FAQ, changelog, blog page templates)
- Email payments variant pack (invoice, dunning, trial ending, payment success/failed templates)

Never in scope:
- Rendered UI components (buyer's design choice)
- Opinionated UI library (buyer brings their own: shadcn, Chakra, Mantine, bespoke)
- Phone-home telemetry
- Runtime license check
- GraphQL (opinionated REST)
- Mobile SDK
- i18n beyond en in v1
- Multi-tenant Row-Level Security (v2)

### 7.5 Non-functional requirements
- Node 20 LTS, PNPM 9
- Postgres 16, Redis 7
- Projected throughput: 8k+ req/sec on KVM 8 (benchmarked and published Week 7)
- All modules independently removable — delete the folder, delete the migration, nothing breaks
- Zero vendor lock-in — every external dep behind an interface
- Docs site with runnable examples
- README includes a 5-minute "build your first thing" walkthrough

### 7.6 Success metrics (OSS tier specifically)
- **Launch (Week 3):** 100 GitHub stars Week 1 of release
- **Day 30:** 300 stars, 20 forks, 5 external PRs
- **Day 90:** 1,000 stars, 50 forks, 20 PRs merged, 2 case studies of side projects built on it
- **Month 6:** 2,500 stars, 100 forks, visible on "awesome Node.js" lists

---

## 8. Flowchart — OSS install and request lifecycle

### 8.1 Install flow (CLI)

```
┌───────────────────────────────────────────────────────────────┐
│  Developer opens terminal                                      │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────┐
│  $ npx create-indiefast@latest my-saas                         │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────┐
│  CLI prompts (OSS Starter Pack):                               │
│                                                                │
│   ? Project name:            my-saas                           │
│   ? Package manager:         pnpm (default) / npm / yarn       │
│   ? Database:                Postgres + Drizzle (default)      │
│   ? Which OSS modules?                                         │
│      ◉ Auth (Better Auth)                                      │
│      ◉ Storage (MinIO/S3)                                      │
│      ◉ Email (base templates)                                  │
│   ? Initialize git repo?     Yes / No                          │
│   ? Install deps now?        Yes / No                          │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────┐
│  CLI scaffolds the monorepo                                    │
│                                                                │
│   • Generates logo-light.svg and logo-dark.svg from project    │
│     initials ("my-saas" → "MS" typed logo, default font)       │
│   • Writes the same logo to apps/api/public/ and               │
│     apps/web/public/                                           │
│   • Materializes the full scaffold (section 7.1)               │
│                                                                │
│   ✓ Scaffolded in ~42 seconds                                  │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────┐
│  Next steps printed by CLI:                                    │
│                                                                │
│   $ cd my-saas                                                 │
│   $ cp .env.example .env                                       │
│   $ docker compose up -d       (Postgres + Redis + MinIO)      │
│   $ pnpm db:migrate                                            │
│   $ pnpm dev                                                   │
│                                                                │
│   → http://localhost:3000      (Next.js app)                   │
│   → http://localhost:4000/api/reference  (Scalar API docs)     │
│   → http://localhost:9001      (MinIO console)                 │
│   → http://localhost:8025      (Mailhog)                       │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
                      Ready to code.
```

### 8.2 Request lifecycle — a signup end-to-end

```
┌────────────────────────────────────────────────────────────────────┐
│  Browser                                                            │
│                                                                     │
│   Developer's own <SignupForm /> (their design system) calls:       │
│   const { mutate } = useSignupCredentials();                        │
│   mutate({ email, password, name });                                │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│  apps/web/src/queries/auth.ts                                       │
│                                                                     │
│   Hook invokes authApi.signupCredentials(input)                     │
│   → shared Axios instance from _client.ts                           │
│   → request ID header attached                                      │
│   → body validated against SignupInput Zod schema from              │
│     packages/types/auth.ts                                          │
│   → POST /api/auth/sign-up/email                                    │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│  apps/api/src/index.ts → server-config.ts                           │
│                                                                     │
│   Express pipeline runs in order:                                   │
│    1. request-logger.ts         (Pino attaches requestId)           │
│    2. security.ts               (helmet + hpp + compression)        │
│    3. request-context.ts        (AsyncLocalStorage)                 │
│    4. rate-limit middleware     (Redis-backed)                      │
│    5. sanitize.ts               (injection guards)                  │
│    6. Better Auth handler       (/api/auth/*)                       │
│    7. mounted module routers    (modules/index.ts)                  │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│  apps/api/src/configs/server-config.ts                              │
│                                                                     │
│   app.all('/api/auth/*splat', toNodeHandler(auth))                  │
│   Better Auth handles endpoint routing and auth semantics directly. │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│  Better Auth runtime + plugins                                      │
│                                                                     │
│   • email/password endpoints                                         │
│   • social OAuth endpoints                                           │
│   • organization plugin endpoints                                    │
│   • OpenAPI schema generation                                        │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│  Better Auth response payloads                                       │
│                                                                     │
│   Auth responses are returned from Better Auth directly under       │
│   /api/auth/*. App envelope still applies to non-auth API modules.  │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│  Back in browser                                                    │
│                                                                     │
│   useSignupCredentials onSuccess fires:                             │
│    • AuthProvider hydrates the new session                          │
│    • QueryClient invalidates ['session'] so useSession() refetches  │
│    • Axios interceptor sets up 401 handling for future requests     │
│                                                                     │
│   Developer's own <SignupForm /> observes the mutation state        │
│   (isPending, isError, error.message) and renders accordingly       │
│   using their chosen UI library.                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 8.3 Mental model — the line between ours and yours

```
         ┌──────────────────────────────────────────────────┐
         │   IndieFast ships this ↓                         │
         │                                                   │
         │   ┌──────────┐    ┌──────────┐    ┌──────────┐  │
         │   │ Postgres │ ◀──│  Backend │ ◀──│   API    │  │
         │   │ Drizzle  │    │  modules │    │  routes  │  │
         │   └──────────┘    └──────────┘    └────┬─────┘  │
         │        ▲                                │        │
         │        │                                ▼        │
         │  ┌─────────────┐              ┌────────────────┐│
         │  │ configs/    │              │ queries/*.ts    ││
         │  │ lib/        │              │ types + api fns ││
         │  │ middleware/ │              │ + TQ hooks      ││
         │  │ types/      │              │ _client (Axios) ││
         │  └─────────────┘              └────────┬────────┘│
         │                                        │         │
         │                                 ┌──────▼──────┐  │
         │                                 │ providers/  │  │
         │                                 │ Auth + Query│  │
         │                                 └──────┬──────┘  │
         └────────────────────────────────────────┼─────────┘
                                                   │
                                                   ▼
         ┌──────────────────────────────────────────────────┐
         │   Developer owns this ↓                          │
         │                                                   │
         │   ┌───────────────────────────────────────────┐  │
         │   │  Their UI (shadcn / Chakra / custom)      │  │
         │   │                                            │  │
         │   │  <SignupForm />   <FileUpload />           │  │
         │   │  <Dashboard />    <SettingsPage />         │  │
         │   │                                            │  │
         │   │  Their design system. Their brand.         │  │
         │   └───────────────────────────────────────────┘  │
         └──────────────────────────────────────────────────┘
```

The line between "ours" and "yours" is deliberately drawn at the hook. Below the hook: production engineering decisions you don't want to redo. Above the hook: design and brand decisions nobody but you can make.

---

## 9. Build roadmap

The scaffold is taught one lesson at a time. Each lesson adds a few files, ends with something you can run, and stops before the next idea. Lesson notes live in `tutorial/`. The code lives in `apps/` and `packages/`.

**Done:** `00-core` lessons 01–21, `01-web` lessons 01–04, `02-auth` lessons 01–14, and `03-storage` lessons 01–04 (user-owned files, presigned MinIO PUT/GET, web hooks). Biome is on the API. `apps/web` still uses ESLint. **Next:** `04-email/01-providers.md`.

### 9.1 Where the repo started

`create-turbo` left a demo monorepo, not IndieFast:

| Path | What it is |
|---|---|
| `apps/web` | Next.js demo on port 3000. It stays. Pages are replaced when the API can answer. |
| `apps/docs` | Second Next.js demo. Lesson 01 deletes it. |
| `packages/ui` | Shared button/card kit. The web chapter deleted it. IndieFast does not ship a UI kit. |
| `packages/typescript-config`, `packages/eslint-config` | Keep. This PRD calls the folder `packages/config`. Renaming it teaches nothing about the API. |
| Root | pnpm workspaces, Turbo. Node `>=24`, pnpm `11.25`, TypeScript 7, Next 16. This PRD names Node 20, pnpm 9, Next 15. The API uses Biome. `apps/web` still uses the scaffold ESLint + Prettier until the web chapter. |

The product is the OSS starter: Express API, Next.js app with hooks only, Postgres, Redis, MinIO, and three modules — Auth, Storage, Email. Payments, entitlements, AI, the Jobs admin product, and admin/marketing stay out.

### 9.2 How a lesson works

One lesson is one sitting. About three new files, one idea, one thing you can run.

Every lesson file has the same shape:

1. **Why** — the production pain this file removes.
2. **The rule** — which layer it belongs to.
3. **The change** — the files, and the one edit to an older file that wires them in.
4. **Walkthrough** — what each file is allowed to know.
5. **Verify** — a command or a request.
6. **Stop** — what the next lesson will add, so this one does not grow.

The four layers, used in every lesson:

- `configs/` knows settings and clients (env, pool, logger, error codes).
- `lib/` knows how to do work, and never sees `req` / `res`.
- `middleware/` is only `(req, res, next)`.
- `modules/<name>/` is one product slice: routes, controller, service, repository, model, OpenAPI, doc.

A helper is written the day something calls it. `slug`, `serializer`, pagination, and audit wait until Auth has a real caller.

Tests start in the errors lesson: one co-located test per lesson, next to the file. Vitest is a habit, not a final chapter.

### 9.3 Syllabus layout

```
tutorial/
  README.md
  00-core/
  01-web/
  02-auth/
  03-storage/
  04-email/
  05-ship/
```

Filenames are ordered: `01-server-setup.md`. Folders follow the modules.

### 9.4 `00-core` — the process that can boot, fail cleanly, and reach its datastores

**01 — `server-setup.md`** — Done.
Delete `apps/docs`. Add `apps/api` with `package.json`, `tsconfig.json`, `src/index.ts`, `src/configs/env.ts`, `src/configs/server-config.ts`. Zod reads `NODE_ENV`, `PORT`, `APP_URL` and crashes the process if they are wrong. `server-config.ts` builds the Express app and returns it. `index.ts` is the only file that calls `listen` (port 4000). `GET /health` returns the success envelope once lesson 03 lands.
Verify: `pnpm --filter api dev`, then `curl localhost:4000/health`.

**02 — `logger.md`** — Done.
`configs/logger/pino.ts` and `middleware/request-logger.ts`. One line in `server-config.ts` mounts the logger.
Verify: one health call prints one structured line with a request id.

**03 — `errors.md`** — Done.
`configs/errors/api-error.ts`, `configs/errors/core-errors.ts`, `middleware/error-handler.ts`, and `lib/responder.ts` (`ok`, `created`, `fail`). `GET /boom` throws `AppError`. The handler answers `{ success: false, error: { code, message }, meta: { requestId } }`.
Verify: `/boom` and `/health` both use that shape. Co-located Vitest tests.

**04 — `origins.md`** — Done.
`configs/origins.ts` plus CORS middleware. Allowlist is `WEB_URL` (default `http://localhost:3000`). `credentials: true`, so the header is the exact origin, never `*`.
Verify: `Origin: http://localhost:3000` passes. A different origin is 403 `ORIGIN_NOT_ALLOWED`.

**05 — `rate-limit.md`** — Done.
`configs/rate-limit.ts` and middleware. The store is in-memory. The policy (how many, which routes) lives in config so Redis can replace the store later without a rewrite.
Verify: the limit-plus-one request returns 429 in the error envelope.

**06 — `openapi.md`** — Done.
`configs/openapi.ts`. Scalar at `http://localhost:4000/api/reference`. Register `/health` by hand.
Each module later exports its own `openapi.ts` and this file merges them.
Verify: the reference page shows health.

**07 — `docker.md`** — Done.
`docker-compose.yml`. Extend `.env.example`: Postgres 16, Redis 7, MinIO (API 9000, console 9001), Mailhog (8025). Add the URLs to the Zod schema. No client code yet.
The app refuses to boot when a URL is missing, even before it connects.
Verify: `docker compose up -d` and the four consoles respond.

**08 — `postgres.md`**
`configs/db/postgres.ts` (Drizzle + `pg` pool) and an empty `configs/db/migrations/`. Boot runs `select 1`. `scripts/migrate.ts` is a thin Drizzle runner.
One pool per process. A request borrows a client and gives it back. Drizzle writes SQL. It is not a second database.
Verify: API logs the ping. Stop Postgres and the boot fails with `AppError`, not a raw stack dump.

**09 — `redis.md`**
`configs/db/redis.ts` (ioredis, because BullMQ uses it). Point the rate limiter at Redis.
Restart the API and the counter is still there.
Verify: that restart test.

**10 — `queues.md`**
`configs/queues/bullmq.ts` only. Create the `email` queue connection. No worker, no job, no admin API.
A queue connection is configuration. The worker is a separate process and arrives with Email. The paid Jobs module is not built here. Email needs the pipe so a signup does not wait on SMTP.
Verify: Redis shows the queue key. Nothing is consumed.

**11 — `storage-client.md`**
`configs/storage/s3.ts`. On boot, ensure the bucket exists. No upload route.
The client knows the endpoint, keys, and bucket. The Storage module will know users and presigned URLs.
Verify: the bucket appears in the MinIO console at `localhost:9001`.

**12 — `shutdown.md`**
`lib/shutdown.ts`. `SIGTERM` stops accept, waits for in-flight requests, then closes the pool, Redis, and the queue.
A deploy is a kill signal. The pool is the resource that leaks when this is missing.
Verify: a slow handler, then `kill`. The process exits after the response, and Postgres shows no abandoned connection.

**13 — `request-context.md`**
`lib/request-context.ts` with `AsyncLocalStorage`. Logger and error handler read `requestId` from context.
`req` is not passed through every function. Context is the implicit argument for one request.
Verify: `/boom` still carries the same id in the log line and the JSON meta.

**14 — `security.md`**
`middleware/security.ts` (helmet, hpp, compression), `middleware/sanitize.ts`, and the dev-only emoji favicon.
These are edge filters. Business rules do not go here.

**15 — `validation.md`**
`middleware/zod-validate.ts`. A temporary `POST /echo` rejects a bad body as 422 in the envelope.
Validation happens at the edge, once. The schema sits beside the route until Web needs it. Then it moves to `packages/types`.
The echo route is deleted when Auth has a real POST.

**16 — `timeout-and-retry.md`**
`lib/with-timeout.ts`, `lib/retry.ts`.
A deadline and backoff are ordinary functions. No Express types in this folder.

**17 — `circuit-breaker.md`**
`lib/circuit-breaker.ts` (Opossum) and `lib/http-client.ts`, which composes timeout, retry, and the breaker.
One slow outbound call must not pin every request. This client is what Email and OAuth will call.
Verify: point it at a local route that sleeps. After the threshold, calls fail fast.

**18 — `idempotency.md`**
`lib/idempotency.ts` and `middleware/idempotency.ts`, stored in Redis. Same `Idempotency-Key` returns the stored response and does not run the handler again.
A double-submitted form should not create two users.
Verify: two identical POSTs to `/echo`, one handler log line.

**19 — `cache.md`**
`lib/cache.ts` and `middleware/cache.ts`.
Health can be cached. Session routes must not be. The middleware takes an allowlist so that rule is code.

**20 — `metrics.md`**
`middleware/metrics.ts`. `GET /metrics` exposes one request counter.
Logs are stories. Metrics are rates. One counter is enough until a real dashboard exists.

**21 — `pipeline.md`**
No new behavior. Reorder `server-config.ts` into the runtime order from section 8.2: request logger, security, request context, rate limit, sanitize, routes, and the error handler last.
Teaching order and runtime order are different. The comment block above `app.use` is the map of the API.

Born later, inside the chapter that calls them: paginator, serializer, slug, HATEOAS links, domain helpers, audit trail.

### 9.5 `01-web` — the browser talks to that API

**01 — `strip-the-demo.md`**
Replace the Turborepo marketing page with App Router groups `(marketing)` and `(app)`. Remove `@repo/ui`. Delete `packages/ui` once the import is gone. Pages are unstyled text.

**02 — `api-client.md`**
`src/lib/env.ts` for `NEXT_PUBLIC_API_URL`. `src/queries/_client.ts` is the only Axios instance: base URL, `withCredentials`, and a request-id header. A page prints the health payload.
The 401 interceptor is added when a session exists.

**03 — `query-provider.md`**
`providers/query-provider.tsx` and `providers/index.tsx`. A `useHealth` query.
Three layers on a trivial endpoint: types, API function, hook. Auth copies this file's shape.

**04 — `ui-hooks.md`**
`use-debounce`, `use-mobile`, `use-media-query`, `use-local-storage`, `use-clipboard`, `use-intersection`.
These are generic. They do not block Auth.

### 9.6 `02-auth` — the first vertical slice

**Done.** This chapter teaches the module shape. Storage and Email repeat the product-route half of it. Auth HTTP is Better Auth, not a custom controller.

**01 — `shared-types.md`**
Create `packages/types` with `auth.ts`: `SignupInput`, `SigninInput`, `Session`. The API imports them. Web imports the same file in lesson 08.
A package appears when a second app needs it.

**02 — `better-auth.md`**
`lib/auth.ts` exports the Better Auth instance (Drizzle adapter, Postgres) and plugins (`openAPI`, `organization`).  
The HTTP API mounts `toNodeHandler(auth)` directly on `/api/auth/*`.
Better Auth owns auth and organization endpoint behavior in this starter pack.

**03 — `model.md`**
`modules/auth/model/core.ts` holds Better Auth core tables (`user`, `session`, `account`, `verification`).
`modules/auth/model/audit.ts` stays app-owned for auth-adjacent audit rows.

**04 — `repository.md`**
`modules/auth/repository.ts` is limited to app-owned auth-adjacent persistence only (for example audit rows).
No wrapper repository for Better Auth endpoint behavior.

**05 — `signup.md`**
`POST /api/auth/sign-up/email` is served natively by Better Auth.
The web hook calls Better Auth directly through the shared Axios client.

**06 — `session.md`**
`GET /api/auth/get-session` is served natively by Better Auth.
`middleware/require-auth.ts` reads session through `auth.api.getSession` and sets `req.user` and `req.session`.

**07 — `signin-logout.md`**
`POST /api/auth/sign-in/email` and `POST /api/auth/sign-out` are served natively by Better Auth.

**08 — `web-hooks.md`**
`apps/web/src/queries/auth.ts` in this order: types, `authApi`, then `useSignupCredentials`, `useSigninCredentials`, `useLogout`, `useSession`.
An unstyled page at `app/(app)/playground/auth/page.tsx` calls the hooks. It is a lab bench, not a component we ship.
Verify: signup in the browser, then refresh, and `useSession` still has the user.

**09 — `auth-provider.md`**
`providers/auth-provider.tsx`. Hydrate the session. The Axios interceptor clears it on 401. `useSignupCredentials` invalidates the `['session']` query.

**10 — `social.md`**
`useSigninSocial` builds the Better Auth URL `GET /api/auth/sign-in/social?provider=...`.
Without OAuth keys the route and hook still exist. The live redirect waits on credentials in `.env`.

**11 — `orgs.md`**
Organization APIs are plugin-owned under `/api/auth/organization/*`.
`useOrg` uses Better Auth organization list endpoint directly.

**12 — `admin-guard.md`**
For non-plugin app routes, `middleware/require-admin.ts` remains available.
For organization resources, authorization is plugin-driven.

**13 — `serializer-and-audit.md`**
`lib/serializer.ts` builds the user DTO. The password hash never reaches `res.created`. `middleware/audit-trail.ts` writes one row for signup and login.

**14 — `api-doc.md`**
Auth docs are generated from Better Auth OpenAPI schema and linked in `/api/reference`.

### 9.7 `03-storage` — the same shape, second time

**Done.** User-owned files. The API authorizes; MinIO carries the bytes.

**01 — `model.md`** — file table, owner, bucket key, migration.
**02 — `presign.md`** — service asks the MinIO client for a presigned PUT and a presigned GET. The API never proxies the bytes.
**03 — `routes.md`** — upload intent, get, delete. Zod schemas in `packages/types/storage.ts`. OpenAPI entries. `storage.api.md`.
**04 — `web-hooks.md`** — `queries/storage.ts`: `useUploadFile`, `useFile`, `useDeleteFile`. Another plain playground page.

The upload goes browser to MinIO. The API only authorizes it.

### 9.8 `04-email` — queue plus a swappable provider

**01 — `providers.md`**
`configs/email/resend.ts` and `configs/email/ses.ts` behind one `send()` function. Dev points at Mailhog. Prod points at SES.
The module calls `send()`. It does not import Resend in a controller.

**02 — `templates.md`**
Welcome, verify, reset. Each returns subject, html, and text.

**03 — `worker.md`**
A worker process consumes the `email` queue from lesson 10. The API only enqueues.
Two processes share Redis. The HTTP request returns before the mail exists. Retry lives on the job.

**04 — `verify-on-signup.md`**
Remove the TODO in the auth service. Signup enqueues the verify template.
Verify: Mailhog at `localhost:8025` shows the message. The signup response did not wait for it.

**05 — `dev-api.md`**
`modules/email` routes mount only when `EMAIL_API_ENABLED` is true. The flag is false outside dev.
Email is an internal service. The HTTP API is a dev tool.

**06 — `web-hooks.md`**
`queries/email.ts`, used by the playground, and omitted from the production provider tree when the flag is off.

### 9.9 `05-ship` — make the repo match the promise

**01 — `removable-modules.md`**
Delete the email folder and its migration on a branch. Boot the API. Put the folder back.

**02 — `scripts.md`**
`scripts/migrate.ts` (finished), `scripts/seed-admin.ts`, `scripts/backup-data.sh`. Root Turbo scripts: `pnpm db:migrate`, `pnpm dev` runs api, web, and the email worker.

**03 — `readme.md`**
Replace the Turborepo README with the five-minute path: copy `.env.example`, compose up, migrate, `pnpm dev`, open `:3000`, `:4000/api/reference`, `:9001`, and `:8025`.

**04 — `tooling.md`**
Biome is already the API linter and formatter. This lesson rolls it onto `apps/web` (and deletes `@repo/eslint-config` + root Prettier once nothing imports them) and decides in writing whether the public starter lowers `engines.node` to 20. The architecture is done, so the Node pin is about adopters, not about boot.

**05 — `cli.md`**
`npx create-indiefast@latest` is a separate package that copies a finished repo and generates the two logos. It starts after the scaffold stops moving.

### 9.10 Left out on purpose

The OSS line ends at Auth, Storage, and Email. Razorpay, GST invoices, entitlements, AI streaming, the Jobs admin product, and admin impersonation are the paid pack. Rendered components stay out. Playground pages exist so the hooks can be exercised. They are not a design system.