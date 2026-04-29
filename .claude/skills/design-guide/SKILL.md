---
name: design-guide
description: Use this skill whenever writing or modifying UI — adding/editing a React component, applying Tailwind classes, styling a page or widget, importing a shadcn/ui component, or doing any visual work in this project. The skill enforces the project's design rules. Invoke proactively before writing any styling so the rules are applied from the first line, not retrofitted.
---

# Pilleus design guide

Three non-negotiable rules. Every UI change must pass all three.

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

## Rule 3 — Animate every appearance, disappearance, expand, collapse

Snap-in / snap-out is a bug. Any UI element that changes its presence or
shape between two states must transition between them.

### When to animate (mandatory)

- **Appears or disappears** — modals, dialogs, drawers, sheets, dropdowns,
  tooltips, popovers, toasts, error/empty/loading states, list items
  added/removed.
- **Expands or collapses** — accordion, collapsible, sidebar collapse, tree
  expand, panel slide.
- **Position changes** — drag-and-drop, reordering, layout shifts caused by
  filtering or sorting.
- **Cross-state visual changes** — tab switch, route transition (where
  meaningful), theme switch (only if subtle — avoid flashing the page).

### Two animation engines, one decision rule

| Engine | Use for | Why |
|--------|---------|-----|
| **`tw-animate-css`** (CSS) | shadcn / Radix components driven by `data-[state=open\|closed]` (Sheet, Dialog, DropdownMenu, Popover, Tooltip, Accordion, Collapsible-from-Radix, Sidebar mobile drawer) | Radix already mounts/unmounts and toggles the data-state attribute; pure CSS animations attach to those states with zero JS overhead. shadcn-generated components ship pre-wired classes (`data-[state=open]:animate-in`, `slide-in-from-left`, `fade-in`, etc.) that simply require this plugin to be imported. Don't rip them out. |
| **`motion`** (JS, formerly framer-motion) | Custom components, anything you build by hand, list reorder, layout animations, complex orchestration | Programmatic control, layout shared elements, stagger, exit before unmount in your own code. |

**Decision rule:** if the element comes from shadcn/Radix and uses
`data-[state]`, leave its CSS animation classes alone — just make sure
`tw-animate-css` is imported in `globals.css`. If you're writing the open/close
logic yourself, use `motion`.

Both engines are wired in this project:
- `tw-animate-css` → imported once at the top of `globals.css`.
- `motion` → `MotionConfig reducedMotion="user"` provider at the FSD app
  layer; all `motion.*` components automatically respect
  `prefers-reduced-motion`. Never override that.

```ts
// CSS (shadcn data-state)
className="data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left"

// JS (custom)
import { motion, AnimatePresence } from "motion/react";
```

**Drawers, sheets, sidebars: must slide.** A drawer that pops in instantly
reads as a bug. shadcn's Sheet has the slide classes pre-wired; if it's
snapping in, the cause is almost always a missing `tw-animate-css` import,
not missing motion code. Check that first.

### Standard durations

| Range | Use for |
|-------|---------|
| 150–200 ms | Small UI: tooltip, dropdown items, fade-in |
| 200–250 ms | Medium UI: collapsible, accordion, dropdown menu, popover |
| 250–300 ms | Large UI: modal, drawer, sheet, page-level transition |
| > 400 ms | Avoid — feels sluggish |
| < 100 ms | Avoid — looks like a glitch (no animation reads cleaner) |

### Standard easing

- **Default** — `ease: [0.3, 0.05, 0.45, 1]` (Material standard easing). Use
  this unless you have a reason not to.
- **Snappy entrance** — `ease: [0.16, 1, 0.3, 1]` (out-expo). For playful or
  delight moments.
- **Spring** — `type: "spring"` only for physical interactions (drag, swipe)
  or layout shifts where overshoot reads as natural. Do NOT spring
  appearance/disappearance — it looks bouncy and unprofessional.

### Patterns (copy these)

**Appear / disappear (opacity)**
```tsx
<AnimatePresence initial={false}>
  {visible && (
    <motion.div
      key="x"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >...</motion.div>
  )}
</AnimatePresence>
```

**Expand / collapse (height + opacity)**
```tsx
<AnimatePresence initial={false}>
  {open && (
    <motion.div
      key="x"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.3, 0.05, 0.45, 1] }}
      style={{ overflow: "hidden" }}
    >...</motion.div>
  )}
</AnimatePresence>
```

**Slide-in (drawer, mobile sidebar)**
```tsx
<motion.aside
  initial={{ x: "-100%" }}
  animate={{ x: 0 }}
  exit={{ x: "-100%" }}
  transition={{ duration: 0.25, ease: [0.3, 0.05, 0.45, 1] }}
/>
```

**List item add / remove (with shared layout)**
```tsx
<AnimatePresence initial={false}>
  {items.map((item) => (
    <motion.li
      key={item.id}
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
    />
  ))}
</AnimatePresence>
```

### `initial={false}` rule

Always set `initial={false}` on `AnimatePresence` (and pass `initial={false}`
on the first-render `motion.div` when relevant) so things already on screen
at first render do **not** animate in. Animations on initial page load are
visual noise — only animate on subsequent state changes.

### Anti-patterns

1. **Tailwind `transition-*` alone for state changes that mount/unmount in
   custom components.** Use `motion` + `AnimatePresence` — Tailwind
   transitions can't run on an element that no longer exists. (For
   shadcn/Radix `data-[state]` components this rule does not apply —
   `tw-animate-css` handles those via attribute-driven keyframes.)
2. **Asymmetric animation.** Has `initial`/`animate` but no `exit` — looks
   like a one-way bug. Always pair entrance with exit.
3. **Animating > 5 elements simultaneously without `layout`.** Causes jank.
   Use `motion`'s `layout` prop or stagger via `transition.staggerChildren`.
4. **Spring on simple appearance.** Modals, dropdowns, tooltips appearing
   should be tween, not spring. Reserve spring for physical motion.
5. **Skipping `prefers-reduced-motion`.** Never bypass `MotionConfig`. If a
   user has reduced motion enabled, transforms must be disabled — opacity
   fades remain.
6. **Animating layout properties on items inside a virtualized list.** Will
   tank scroll perf. Animate the container instead, or skip animation there.

### When to skip animation

- Initial page load — let `initial={false}` and `MotionConfig` handle it.
- Below 100 ms timing — animation loses meaning, no animation reads cleaner.
- Inside virtualized lists — perf cost outweighs the benefit.
- Critical-path interactions where every ms matters (e.g. typing latency).

---

## Quick checklist before submitting any UI change

- [ ] No `border-*` / `ring-*` / `divide-*` was added unless it is a focus,
      error, or selection affordance — or the *only* viable solution.
- [ ] Every color comes from a token utility (`bg-primary`, `text-foreground`,
      …); zero raw hex, zero Tailwind palette colors (`bg-zinc-*`,
      `text-blue-*`).
- [ ] If a new color was needed, it was added to `color.css` first, then used.
- [ ] Every appearing/disappearing/expanding/collapsing element uses
      `motion` + `AnimatePresence` — no snap-in/snap-out.
- [ ] `AnimatePresence` has `initial={false}` so first render does not animate.
- [ ] Duration is in the 150–300 ms range; easing is `[0.3, 0.05, 0.45, 1]`
      unless a specific pattern (slide, spring) calls for something else.
