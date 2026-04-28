# Pilleus

pnpm + Turborepo monorepo. Inside the Next.js app, frontend and backend live
side-by-side under `src/client/` (FSD) and `src/server/` (DDD-based Clean
Architecture).

## Architecture at a glance

| Concern | Where | Style |
|---------|-------|-------|
| Frontend | `apps/web/src/client/` | [Feature-Sliced Design](https://feature-sliced.design) |
| Backend | `apps/web/src/server/` | DDD-based Clean Architecture |
| Routing | `apps/web/app/` | Next.js App Router (thin re-export only) |
| DB schema | `packages/db/` | Drizzle ORM (shared with Better Auth) |

The `app/` directory is a thin layer: each `page.tsx` re-exports a view from
`src/client/pages/`, and each `api/*/route.ts` delegates to `src/server/`.

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.2.4 |
| API | tRPC | 11.16.0 |
| ORM | Drizzle ORM | 0.45.2 |
| Validation | Zod | 4.3.6 |
| DB | Neon (serverless Postgres) | - |
| Auth | Better Auth | 1.6.9 |
| UI | Tailwind CSS + shadcn/ui | 4.2.4 |
| State | TanStack Query + Zustand | 5.x |
| Forms | React Hook Form + Zod | 7.74.0 |
| MCP | @vercel/mcp-adapter | 1.0.0 |
| Mono | pnpm workspaces + Turborepo | - |

## Project Structure

```
pilleus/
├── apps/
│   └── web/
│       ├── app/                            # Next.js App Router — thin routing
│       │   ├── layout.tsx                  # uses src/client/app/providers + styles
│       │   ├── page.tsx                    # re-exports @/pages/home
│       │   ├── sign-in/page.tsx            # re-exports @/pages/sign-in
│       │   ├── dashboard/page.tsx          # re-exports @/pages/dashboard
│       │   └── api/
│       │       ├── auth/[...all]/route.ts  # delegates to @/server (Better Auth)
│       │       ├── trpc/[trpc]/route.ts    # delegates to @/server (appRouter)
│       │       └── mcp/route.ts            # delegates to @/server (mcpHandler)
│       └── src/
│           ├── client/                     # FRONTEND (FSD)
│           │   ├── app/                    # FSD app layer
│           │   │   ├── providers/          # AppProviders (TRPCReactProvider, ...)
│           │   │   └── styles/globals.css
│           │   ├── pages/                  # FSD pages layer (per-route slice)
│           │   │   ├── home/
│           │   │   ├── sign-in/
│           │   │   └── dashboard/
│           │   ├── widgets/                # composite UI blocks
│           │   ├── features/               # user-facing actions
│           │   ├── entities/               # business entities (session, project)
│           │   └── shared/                 # ui kit, api clients, lib, config
│           └── server/                     # BACKEND (DDD-based Clean Architecture)
│               ├── shared/                 # shared kernel
│               │   ├── domain/{entity,value-object,aggregate-root}.ts
│               │   ├── errors/domain-error.ts
│               │   └── trpc/{init,context}.ts
│               ├── iam/                    # Bounded Context — Identity & Access
│               │   ├── domain/{entities,value-objects,repositories}/
│               │   ├── application/use-cases/
│               │   ├── infrastructure/{auth/better-auth.ts, repositories/}
│               │   └── interface/trpc/user.router.ts
│               ├── project/                # Bounded Context — Project
│               │   ├── domain/
│               │   ├── application/{use-cases,dto}/
│               │   ├── infrastructure/repositories/
│               │   └── interface/trpc/project.router.ts
│               ├── mcp/interface/handler.ts
│               ├── app-router.ts           # composition root: aggregate tRPC routers
│               └── index.ts                # public API: appRouter, auth, mcpHandler, ...
└── packages/
    └── db/                                 # Drizzle schema + Neon HTTP client
        └── src/{schema,index,migrate}.ts
```

## TypeScript path aliases

```json
"@/*":         "./src/*"
"@/app/*":     "./src/client/app/*"
"@/pages/*":   "./src/client/pages/*"
"@/widgets/*": "./src/client/widgets/*"
"@/features/*":"./src/client/features/*"
"@/entities/*":"./src/client/entities/*"
"@/shared/*":  "./src/client/shared/*"
"@/server":    "./src/server/index.ts"
"@/server/*":  "./src/server/*"
```

This means FSD code can keep importing as `@/shared/...`, `@/entities/...` etc.
without leaking the `src/client/` prefix. Server code is reached via `@/server`.

## FSD rules (frontend)

Layers can only import from layers **below** them:

```
app → pages → widgets → features → entities → shared
```

Each slice exposes its public API via `index.ts`. Same-layer cross-imports are
forbidden, except via the `@x` notation in `entities/`.

The `app/` directory at the project root is the Next.js App Router — kept thin.
The FSD app layer (providers, styles) lives at `src/client/app/`. There is no
collision because Next.js does not auto-detect arbitrarily-nested folders.

The FSD pages layer at `src/client/pages/` does not collide with the Next.js
Pages Router either, because Next.js only auto-detects `pages/` at the project
root or directly under `src/` (i.e. `src/pages/`).

## DDD / Clean Architecture rules (backend)

Each Bounded Context has four layers with a strict inward dependency rule:

```
interface ──▶ application ──▶ domain
                                ▲
infrastructure ─────────────────┘
```

- **domain** — Pure model. Aggregate roots, entities, value objects, repository
  interfaces (ports). No framework imports.
- **application** — Use cases orchestrate the domain. One class per use case.
- **infrastructure** — Adapters: Drizzle repository implementations, Better Auth.
- **interface** — Inbound adapters. tRPC routers stay thin: validate input with
  Zod, instantiate the use case, return the DTO.

Domain errors (`NotFoundError`, `ForbiddenError`, …) thrown from any layer are
mapped to tRPC error codes by middleware in `src/server/shared/trpc/init.ts`.

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- [Neon](https://neon.tech) database

### Setup

```bash
pnpm install
cp .env.example apps/web/.env
```

Edit `apps/web/.env`:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
BETTER_AUTH_SECRET="your-random-secret-at-least-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Database

```bash
pnpm db:push                                    # push schema to Neon
pnpm db:generate                                # generate migrations
pnpm db:migrate                                 # run migrations
pnpm --filter @pilleus/db db:studio             # open Drizzle Studio
```

### Development

```bash
pnpm dev
```

Runs Next.js dev server with Turbopack at `http://localhost:3000`.

### Build

```bash
pnpm build
```

### Adding shadcn/ui Components

`components.json` is wired to FSD paths — components land in
`src/client/shared/ui/`.

```bash
cd apps/web
npx shadcn@latest add <component>
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/trpc/*` | tRPC API (queries & mutations from `@/server`) |
| `/api/auth/*` | Better Auth (sign-in, sign-up, OAuth) |
| `/api/mcp` | MCP server (AI tool integration) |
