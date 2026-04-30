# Pilleus — house rules for Claude

## Respond in Korean

All user-facing comments and explanations must be written in Korean (한글).
Code, identifiers, file paths, and tool output stay in their original form.

## Never delete `.next/` while a dev server may be running

The user runs `pnpm dev` in their own terminal. The dev server keeps mutable
state under `apps/web/.next/dev/` (manifests, server chunks, turbopack
runtime). `rm -rf .next` from any tool — including build verification — wipes
that working directory out from under the live process, and every subsequent
request 500s with `ENOENT: routes-manifest.json` / `[turbopack]_runtime.js`
until they restart.

### Default to non-destructive verification

Use these in this order; only fall back to a real build when necessary:

1. **`pnpm exec tsc --noEmit`** — full TypeScript check, never touches `.next/`.
   This is enough for almost every code change.
2. **`pnpm exec tsc --noEmit -p packages/server/tsconfig.json`** — narrower
   scope when only the server package changed.
3. **`pnpm build`** *(only when needed and only with the user's go-ahead)* —
   shares `.next/` with the dev server. Stop and ask first. If the user
   approves, prefer `next build --no-lint` over a full clean+build, and
   never run `rm -rf .next` as part of it.

### If a build is genuinely required

- Ask the user first ("OK to run the production build? It will conflict with
  any running `pnpm dev`.").
- If they say yes and a dev server is running, they should stop it before
  the build and restart after.
- Don't pre-clean `.next/`. Next.js handles its own incremental state. The
  only legitimate reason to `rm -rf .next` is recovery from a corrupted
  build, in which case ask first regardless.

### Why this rule exists

Multiple sessions in early development hit the same failure mode: the dev
server appeared to crash with no obvious cause, but the real cause was
`.next/` being deleted by a parallel build verification. Saving here so the
mistake doesn't repeat.
