---
name: design-guide
description: Use this skill whenever writing or modifying UI — adding/editing a React component, applying Tailwind classes, styling a page or widget, importing a shadcn/ui component, or doing any visual work in this project. The skill enforces the project's design rules. Invoke proactively before writing any styling so the rules are applied from the first line, not retrofitted.
---

# Pilleus design guide

Two non-negotiable rules. Every UI change must pass both.

---

## Rule 1 — Remove borders aggressively

**Default to no border.** A border is opt-in, not opt-out.

- Do **not** add `border`, `border-*`, `divide-*`, `ring`, or any utility that
  draws a line, unless it is **strictly necessary for affordance** (e.g. an
  outlined input that has no other way to communicate "this is editable").
- Prefer these alternatives, in order:
  1. **Whitespace** (`gap`, `space-y`, `p-*`, `m-*`)
  2. **Background contrast** (`bg-card`, `bg-muted`) using design tokens
  3. **Shadow** (`shadow-xs`, `shadow-sm`) — but only when neither whitespace
     nor background contrast suffices
  4. Border — last resort
- When using or adopting a shadcn/ui component that ships with a border
  (e.g. `Card`, `Input`, `Select`), **strip the border** (`border-0`) unless
  it is genuinely required. shadcn defaults are a starting point, not a spec.
- `border-border` (the token-based default border in this repo) is still a
  border. The rule applies to it too.
- If you find yourself adding a border to fix a layout that "feels flat",
  the real fix is almost always more spacing or a background-tone shift —
  go fix that first.

### What to do when you think you need a border

Stop and ask, in order:
1. Can `gap` / `padding` separate these elements instead?
2. Can `bg-card` / `bg-muted` create the visual grouping?
3. Can a `shadow-*` token convey elevation?
4. Is this a focus / error / selected affordance? — those are the *only*
   borders that consistently survive review.

---

## Rule 2 — Only use design tokens from `color.css`

**The single source of truth for color is `color.css`.** Nothing else.

- All color values in components must reference a token defined in
  `color.css` (via the corresponding Tailwind utility:
  `bg-primary`, `text-foreground`, `border-border`, etc.).
- **Forbidden:**
  - Raw hex (`#ffffff`, `#abc123`)
  - Raw `rgb(...)`, `hsl(...)`, `oklch(...)` literals in components
  - Tailwind palette utilities like `bg-zinc-900`, `text-blue-500`,
    `border-gray-200` — these bypass the token system
  - Inline `style={{ color: ... }}` with non-token values
  - New CSS variables defined outside `color.css`
- **Allowed:**
  - Token-backed Tailwind utilities only:
    `bg-background`, `bg-card`, `bg-popover`, `bg-primary`, `bg-secondary`,
    `bg-muted`, `bg-accent`, `bg-destructive`, `bg-input`,
    plus `text-*-foreground`, `border-border`, `ring-ring`, etc.
  - Opacity modifiers on token colors (`bg-primary/90`, `ring-ring/50`).

### If a needed color does not exist as a token

Do **not** hardcode the value in a component. Instead:
1. Add the token to `color.css` (both `:root` and `.dark` blocks).
2. If the token is theme-related, also expose it via the Tailwind theme
   mapping in `globals.css` (the `@theme inline { --color-foo: var(--foo); }`
   block) so the corresponding utility (`bg-foo`, `text-foo`) becomes available.
3. Then reference the new token from the component.

Adding a token is a deliberate design decision — keep the set small. If you
catch yourself adding a token "just for this one screen", you are probably
solving the wrong problem; reuse an existing token (often `muted` or `accent`
will do).

### Where the tokens live

- **Palette + semantic tokens** → `apps/web/src/client/app/styles/color.css`
  - Tier 1 (palette): `--neutral-*`, `--red-*`, …
  - Tier 2 (semantic): `--background`, `--foreground`, `--primary`, …
    Light theme in `:root`, dark theme in `.dark`.
- **Tailwind utility mapping** → `apps/web/src/client/app/styles/globals.css`
  - `@theme inline { --color-background: var(--background); ... }`
  - This is what makes `bg-background`, `text-foreground`, etc. work.

When adding a token: edit `color.css` (palette + semantic) AND `globals.css`
(`@theme inline` mapping). Both files must be updated for a new token to
become a usable Tailwind utility.

---

## Quick checklist before submitting any UI change

- [ ] No `border-*` / `ring-*` / `divide-*` was added unless it is a focus,
      error, or selection affordance — or the *only* viable solution.
- [ ] Every color comes from a token utility (`bg-primary`, `text-foreground`,
      …); zero raw hex, zero Tailwind palette colors (`bg-zinc-*`,
      `text-blue-*`).
- [ ] If a new color was needed, it was added to `color.css` first, then used.
