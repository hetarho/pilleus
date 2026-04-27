# Pilleus

pnpm + Turborepo monorepo.

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.2.4 |
| API | tRPC | 11.16.0 |
| ORM | Drizzle ORM | 0.45.2 |
| Validation | Zod | 4.3.6 |
| DB | Neon (serverless Postgres) | - |
| Auth | Better Auth + OAuth Provider | 1.6.9 |
| UI | Tailwind CSS + shadcn/ui | 4.2.4 |
| State | TanStack Query + Zustand | 5.100.5 / 5.0.12 |
| Forms | React Hook Form + Zod | 7.74.0 |
| MCP | @modelcontextprotocol/sdk + @vercel/mcp-adapter | 1.29.0 / 1.0.0 |
| Mono | pnpm workspaces + Turborepo | - |
| Deploy | Vercel | - |

## Project Structure

```
pilleus/
├── apps/
│   └── web/                     # Next.js 16 application
│       └── src/
│           ├── app/             # App Router pages & API routes
│           │   ├── api/auth/    # Better Auth handler
│           │   ├── api/trpc/    # tRPC handler
│           │   └── api/mcp/     # MCP server endpoint
│           ├── trpc/            # tRPC client, server caller, routers
│           └── lib/             # auth, utils
├── packages/
│   └── db/                      # Drizzle schema & DB client
│       └── src/
│           ├── index.ts         # Neon HTTP connection
│           └── schema.ts        # DB schema (Better Auth + OAuth)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- [Neon](https://neon.tech) database

### Setup

```bash
# Install dependencies
pnpm install

# Copy env file and fill in your values
cp .env.example apps/web/.env
```

Edit `apps/web/.env`:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
BETTER_AUTH_SECRET="your-random-secret-at-least-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database

```bash
# Push schema to Neon
pnpm db:push

# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio
pnpm --filter @pilleus/db db:studio
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

### Adding UI Components

```bash
cd apps/web
npx shadcn@latest add button
npx shadcn@latest add input
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/trpc/*` | tRPC API (queries & mutations) |
| `/api/auth/*` | Better Auth (sign-in, sign-up, OAuth) |
| `/api/mcp` | MCP server (AI tool integration) |
