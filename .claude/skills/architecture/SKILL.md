---
name: architecture
description: Use this skill whenever working on this project — adding/modifying a page, feature, widget, entity, tRPC procedure, use case, repository, domain rule, or deciding where new code should live. The project uses FSD (Feature-Sliced Design v2.1, page-first) for the frontend and DDD-based Clean Architecture for the backend, all inside a single Next.js app. Invoke proactively before writing any non-trivial code so placement and dependency rules are correct from the first line.
---

# Pilleus architecture

This project is **one Next.js app** with a strict internal split:

```
apps/web/
├── app/                    # Next.js App Router — thin re-export layer (DO NOT put logic here)
└── src/
    ├── client/             # FRONTEND — Feature-Sliced Design v2.1 (page-first)
    └── server/             # BACKEND  — DDD-based Clean Architecture, by Bounded Context
```

Everything else flows from this. The two halves can be reasoned about independently
because they meet only at the tRPC contract (`@/server` → typed `appRouter`).

---

## Part 1 — Frontend rules (FSD v2.1, page-first)

### 1.1 Layers (top → bottom, dependency direction)

```
app  →  pages  →  widgets  →  features  →  entities  →  shared
```

A layer can import only from layers **below** it. Same-layer cross-imports are
forbidden. The only exception is `entities/` cross-imports via `@x/` notation
(rare; not currently used in this repo).

| Layer | What lives here | Rule of thumb |
|-------|-----------------|---------------|
| `app` | providers, global styles, root setup | Anything that wraps the whole app once |
| `pages` | one slice per route — most code starts here | A slice = a route's worth of UI + logic |
| `widgets` | composite UI blocks reused across pages | Only if 2+ pages need it |
| `features` | a single user-facing action | A button/form that *does* something |
| `entities` | business nouns (User, Project) | Only if 2+ features touch the same noun |
| `shared` | non-business primitives | UI kit, http clients, utilities, env |

### 1.2 Page-first workflow (THIS IS THE CORE METHODOLOGY)

FSD v2.1 explicitly recommends **deferred decomposition**. The official guidance:

> *"In v2.1, we recommend starting with pages, and possibly even stopping there.
> If a need arises to reuse business logic across several pages, you can move it
> to a layer below."*

**Concrete workflow when adding a new feature:**

1. **Drop everything into `pages/<slice>/`** — UI, hooks, types, even ad-hoc API
   calls. One slice can contain many files. Don't pre-decompose into entities/features.
2. **Ship it.** Don't refactor before the second use case exists.
3. **When a second page needs the same thing**, *then* extract:
   - Reusable UI block → `widgets/`
   - User action (button + mutation) → `features/`
   - Business noun shared across features → `entities/`
   - Generic primitive (ui kit, util) → `shared/`
4. **Move bottom-up only when you have evidence of reuse.** The further down you
   move code, the wider its blast radius — refactoring `entities/` can break
   anything above it.

**Anti-pattern (v2.0 style, do NOT do this):** decomposing every UI element into
features and entities up front, leaving pages as thin compositional shells.
Most of this repo's code should live in `pages/<slice>/`. If `entities/` and
`features/` look fat, that's a smell.

### 1.3 Slice structure (segments)

Each slice (a folder under any layer except `shared`) is internally organized
by **segments** that group code by technical purpose:

```
<layer>/<slice>/
├── ui/             # React components
├── model/          # state, types, hooks (business logic)
├── api/            # network calls, tRPC query wrappers
├── lib/            # slice-internal utilities
├── config/         # slice-internal constants
└── index.ts        # public API — REQUIRED
```

Not all segments are needed for every slice. Use only what applies.

`shared/` is special: it has segments at the top level (no slices), and each
segment can have its own `index.ts`:

```
shared/
├── ui/             # one index.ts here for the UI kit
├── api/            # ...
├── lib/
└── config/
```

### 1.4 Public API rule

**Every slice exposes a public `index.ts`.** Outside code may import only what
the index re-exports. Internal file structure is a private implementation detail.

```ts
// src/client/entities/project/index.ts
export type { Project } from "./model/types";
export { useProjectListQuery } from "./api/queries";
export { ProjectCard } from "./ui/project-card";
```

```ts
// Good
import { ProjectCard } from "@/entities/project";

// Bad — reaches into internals
import { ProjectCard } from "@/entities/project/ui/project-card";
```

### 1.5 Naming conventions used in this repo

- **kebab-case** everywhere (folders and files).
- Slice names are **business-meaningful**, not technical.
- Components inside `ui/` use kebab-case files (`project-card.tsx`) but
  PascalCase exports (`ProjectCard`).
- Feature slices currently use a mix of `<entity>-<action>` (e.g.
  `project-create`, `project-delete`) and the canonical FSD `auth-by-<provider>`
  pattern (e.g. `auth-by-google`). FSD does not prescribe one or the other —
  both are valid. When adding a new feature, match the pattern of the closest
  existing one.

### 1.6 Path aliases (TS)

Defined in `apps/web/tsconfig.json`:

```
@/*          → ./src/*
@/app/*      → ./src/client/app/*
@/pages/*    → ./src/client/pages/*
@/widgets/*  → ./src/client/widgets/*
@/features/* → ./src/client/features/*
@/entities/* → ./src/client/entities/*
@/shared/*   → ./src/client/shared/*
@/server     → ./src/server/index.ts
@/server/*   → ./src/server/*
```

The `src/client/` prefix is **invisible** to imports — FSD code keeps writing
`@/shared/ui/button` etc. exactly as in any FSD project. The only exception
is `@/server` (BE entry point).

### 1.7 Cross-feature composition rule

Features must NOT import each other. If a page needs feature A's button next
to feature B's form, the **page composes them**:

```tsx
// src/client/pages/dashboard/ui/dashboard-view.tsx
import { CreateProjectForm } from "@/features/project-create";
import { ProjectList } from "@/widgets/project-list";

export function DashboardView() {
  return <><CreateProjectForm /><ProjectList /></>;
}
```

---

## Part 2 — Backend rules (DDD-based Clean Architecture)

### 2.1 Bounded Contexts

Each top-level folder under `src/server/` (except `shared/`) is a **Bounded
Context** — a self-contained business subdomain. Current contexts:

- `iam/` — Identity & Access Management (user, session, OAuth via Better Auth)
- `project/` — Project lifecycle (CRUD, ownership)
- `mcp/` — Model Context Protocol handler (AI tool integration)

**Add a new context** when you have a distinct vocabulary and lifecycle (e.g.
`billing/`, `notification/`). **Do NOT** create a context per CRUD entity if
they belong to the same domain language.

### 2.2 Layers within a context (dependency direction is INWARD)

```
interface ──▶ application ──▶ domain
                                ▲
infrastructure ─────────────────┘
```

```
<context>/
├── domain/              # Pure model — no framework imports
│   ├── entities/        # Aggregate roots, entities (identity + behavior + invariants)
│   ├── value-objects/   # Immutable values (equality by value)
│   └── repositories/    # Persistence interfaces (ports)
├── application/         # Use cases orchestrate the domain
│   ├── use-cases/       # One class per use case
│   └── dto/             # Input/output shapes
├── infrastructure/      # Outbound adapters
│   ├── repositories/    # Drizzle implementations of domain interfaces
│   └── auth/            # Better Auth, etc.
└── interface/           # Inbound adapters (drivers)
    └── trpc/            # tRPC routers — thin: validate → call use case → return DTO
```

### 2.3 Layer responsibilities

**`domain/` — pure business model**
- Entities have private constructors + static factories (`create()`, `reconstitute()`)
- Value objects extend `ValueObject<T>` from `shared/domain/`
- Aggregate roots extend `AggregateRoot<TId>`
- Repository interfaces define ports — implementations live in `infrastructure/`
- **Forbidden:** `import` from any framework, ORM, or external lib.
- Throw `DomainError` subclasses (`ValidationError`, `NotFoundError`, `ForbiddenError`,
  `ConflictError`) — they get mapped to tRPC error codes automatically.

**`application/` — use cases**
- One class per use case, with a single `execute()` method.
- Constructor injects repository interfaces (NOT implementations).
- Returns DTOs (plain objects), never domain entities, across the boundary.
- **Forbidden:** importing from `infrastructure/`. Application depends only on
  `domain/` interfaces.

**`infrastructure/` — adapters**
- Drizzle repositories implement domain repository interfaces.
- `reconstitute()` factory rebuilds entities from raw DB rows.
- Better Auth instance configured here.
- This is the only layer allowed to import `@pilleus/db`.

**`interface/trpc/` — inbound adapters**
- tRPC routers stay **thin**: validate input with Zod → instantiate use case
  with concrete repository → return DTO.
- No business logic in routers. If a router has more than ~10 lines per
  procedure, extract to a use case.

### 2.4 Domain error mapping

`src/server/shared/trpc/init.ts` has middleware that maps domain errors to
tRPC error codes:

| Domain error | tRPC code |
|--------------|-----------|
| `NotFoundError` | `NOT_FOUND` |
| `ForbiddenError` | `FORBIDDEN` |
| `ValidationError` | `BAD_REQUEST` |
| `ConflictError` | `CONFLICT` |
| any other `DomainError` | `BAD_REQUEST` |

So use cases just `throw new NotFoundError(...)` — no need to know about HTTP
or tRPC.

### 2.5 Composition root

`src/server/app-router.ts` aggregates per-context tRPC routers into the single
`appRouter`. `src/server/index.ts` is the public API consumed by:
- `apps/web/app/api/auth/[...all]/route.ts` → `auth`
- `apps/web/app/api/trpc/[trpc]/route.ts` → `appRouter`, `createContext`
- `apps/web/app/api/mcp/route.ts` → `mcpHandler`
- `apps/web/src/client/shared/api/trpc/{client,server}.ts` → `AppRouter` type, `createCallerFactory`

---

## Part 3 — Decision tree: where does new code go?

When asked to implement something, apply this in order:

### 3.1 Frontend code

```
Is it a new route/page?
├── YES → src/client/pages/<slice>/   (start here, keep everything inside)
└── NO  ↓

Does it touch network / tRPC / external API?
├── YES → src/client/entities/<noun>/api/    (typed query/mutation hook)
│         OR keep inline in the page if used once
└── NO  ↓

Is it a UI primitive (button, dialog, input)?
├── YES → src/client/shared/ui/    (only if framework-agnostic, no business words)
└── NO  ↓

Is it reusable across ≥2 pages?
├── NO  → keep it in the page that uses it
└── YES ↓
        Is it a user action (one button → one outcome)?
        ├── YES → src/client/features/<verb-noun>/
        └── NO  → src/client/widgets/<name>/   (composite UI block)
```

**When in doubt, keep it in the page.** Moving down later is cheap; moving up
after over-decomposition is painful.

### 3.2 Backend code

```
Is it a new tRPC procedure for an existing context?
├── YES → src/server/<context>/interface/trpc/<context>.router.ts
│         + new use case if logic is non-trivial
└── NO  ↓

Is it a new business operation?
├── YES → src/server/<context>/application/use-cases/<verb>-<noun>.ts
│         (one class, one execute(), inject repository interface)
└── NO  ↓

Is it a domain rule / invariant / business calculation?
├── YES → src/server/<context>/domain/entities/<noun>.ts
│         (encapsulate inside the aggregate root)
└── NO  ↓

Is it persistence / external service / DB query?
├── YES → src/server/<context>/infrastructure/...
│         (implement domain repository interface)
└── NO  ↓

Is it a NEW business subdomain with distinct vocabulary?
├── YES → new bounded context: src/server/<new-context>/
└── NO  → reconsider — it probably fits in an existing layer above
```

---

## Part 4 — Concrete examples from this repo

### 4.1 Adding a "rename project" feature (FE + BE)

**Backend (start here):**

1. Add domain method:
   ```ts
   // src/server/project/domain/entities/project.ts (already has rename())
   rename(name: string): void {
     this.props = { ...this.props, name: ProjectName.create(name), updatedAt: new Date() };
   }
   ```

2. New use case:
   ```ts
   // src/server/project/application/use-cases/rename-project.ts
   export class RenameProjectUseCase {
     constructor(private readonly projects: ProjectRepository) {}
     async execute(input: { id: string; name: string; userId: string }) {
       const project = await this.projects.findById(input.id);
       if (!project) throw new NotFoundError(`Project ${input.id} not found`);
       if (!project.isOwnedBy(input.userId)) throw new ForbiddenError("...");
       project.rename(input.name);
       await this.projects.save(project);
       return toProjectDTO(project);
     }
   }
   ```

3. Wire into router:
   ```ts
   // src/server/project/interface/trpc/project.router.ts
   rename: protectedProcedure
     .input(z.object({ id: z.string().uuid(), name: z.string().min(1) }))
     .mutation(async ({ ctx, input }) => {
       const useCase = new RenameProjectUseCase(projectRepository);
       return useCase.execute({ ...input, userId: ctx.user.id });
     }),
   ```

**Frontend (page-first):**

1. **First pass:** put the rename UI/logic directly in `src/client/pages/dashboard/`
   alongside everything else. Inline tRPC mutation, inline form.
2. Ship it.
3. **Only if** another page (e.g. project detail page) needs the same rename
   capability, extract to `src/client/features/project-rename/`. Until then,
   leave it in the page.

### 4.2 Adding a new entity that only one page uses

Don't create a slice in `entities/`. Keep types and hooks in the page's `model/`
segment. Promote to `entities/` later if a second consumer appears.

### 4.3 Adding shadcn/ui component

```bash
cd apps/web && npx shadcn@latest add <component>
```
Lands in `src/client/shared/ui/` automatically (configured in `components.json`).

---

## Part 5 — Common pitfalls (do NOT do these)

1. **Pre-extracting to entities/features before reuse exists.** This is v2.0
   thinking. v2.1 says: keep it in the page until the second use case appears.
2. **Putting business logic in tRPC routers.** Routers are inbound adapters.
   If the router has logic, extract to a use case.
3. **Importing from `@pilleus/db` outside `src/server/<context>/infrastructure/`.**
   Domain and application must not know about Drizzle.
4. **Cross-feature imports.** Features must not import each other. Page composes them.
5. **Reaching into a slice's internals.** Always import from the slice's `index.ts`,
   never from `<slice>/ui/<component>` directly.
6. **Skipping the use case layer.** Even a one-line operation goes through
   `application/use-cases/` so authorization, validation, and orchestration live
   in one consistent place.
7. **Adding logic to `apps/web/app/`.** That directory is purely Next.js routing
   glue — it must only re-export and delegate.
8. **Naming features by technical concern** (`use-form`, `api-call`, `state-mgmt`).
   Names must reflect the user's vocabulary (`project-create`, `auth-by-google`).
9. **Putting `"use client"` too high in the tree.** Push it down to the smallest
   leaf component that needs it. Pages and views can stay server components when
   possible.
10. **Renaming `views/` and forgetting `apps/web/pages/` is no longer needed.**
    Since FSD pages live at `src/client/pages/` (not `src/pages/`), Next.js does
    NOT auto-detect them as Pages Router. No empty `pages/` stub needed.

---

## References

- FSD official site: https://feature-sliced.design
- FSD v2.1 page-first migration guide: https://feature-sliced.design/docs/guides/migration/from-v2-0
- FSD with Next.js: https://feature-sliced.design/docs/guides/tech/with-nextjs
- This repo's structure: see project root `README.md`
