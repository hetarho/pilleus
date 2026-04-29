---
name: color-tokens
description: Use this skill whenever editing the color token system — modifying `apps/web/src/client/app/styles/color.css`, the `@theme inline` block in `globals.css`, the `.dark` block, dark-mode mappings, or adding/removing/renaming a palette color or semantic token. Also use when designing a new color (success, warning, info, brand) before adding it. This skill encodes the modern UI/UX guidance the token system was built on, so the system stays internally consistent every time it grows.
---

# Color tokens — modern UI/UX rules

This skill is for **maintainers of the token system**, not consumers. If you
are styling a component, see `design-guide`. If you are adding/editing tokens
themselves, follow this.

The token system is built on rules drawn from current authoritative sources:
Tailwind v4 docs, Radix Colors, Material Design 3, Apple Human Interface
Guidelines, GitHub Primer, and WCAG 2.2. Each rule below cites the rationale.

---

## Hard rules

### R0 — Surface elevation: sunken / surface / raised / overlay

Surfaces are organized by elevation, not by component. Four position-based
tokens express any surface in the system:

| Token | Meaning | Light | Dark |
|-------|---------|-------|------|
| `--surface-sunken` | Recessed inside the current surface | one neutral step darker | same as `--surface` |
| `--surface` | Default page surface (= `--background`) | `--neutral-0` | `--neutral-950` |
| `--surface-raised` | Elevated above the current surface | same color + shadow | one neutral step lighter |
| `--surface-overlay` | Floating on everything (popover, dialog) | same color + bigger shadow | two neutral steps lighter |

In light mode the page is already very bright, so "raised" cannot get
brighter — elevation is communicated by **shadow**. Sunken still goes a
step darker.

In dark mode the page is dark, so elevation goes **lighter** (Material 3
tonal elevation). Sunken collapses to the page color so a nested element
appears carved into its parent.

**Nested cards** (card-in-card, panel-in-panel): outer is `--surface-raised`,
inner is `--surface-sunken`. The same token works at any depth — depth-3
nesting still uses sunken, with spacing differentiating levels. Don't add
`--surface-sunken-deeper` etc.; that path leads to combinatorial token bloat.

Functional tokens (`--card`, `--popover`, `--muted`, `--input`) are
**aliases** of these four. Components consume the functional names; the
aliasing centralizes wiring so a system-wide elevation tweak touches one
file.

### R1 — Two-tier system: palette → semantic

Tokens come in exactly two tiers, in this order:

1. **Tier 1 — palette** (`--neutral-500`, `--red-600`, …): raw OKLCH values.
   Defined once. Never referenced from a component.
2. **Tier 2 — semantic** (`--background`, `--foreground`, `--primary`, …):
   role-based; references the palette via `var()`. Components consume only
   these.

Forbidden:
- Components importing palette tokens directly (`bg-neutral-500` is wrong).
- Semantic tokens with raw OKLCH literals (must reference palette via `var()`).
- A third tier ("component tokens" like `--button-bg`). Keep it at two tiers
  until there is overwhelming evidence the system needs more.

> Why: every major design system (Radix, Material 3, Primer, Atlassian,
> Fluent) uses 2-tier. Three-tier is reserved for design systems shipping to
> 100+ products; we are not that.

### R2 — OKLCH only

All color values in `color.css` must be in `oklch(...)` notation. No `#hex`,
no `rgb()`, no `hsl()`, no named colors.

> Why: Tailwind v4 emits OKLCH by default; OKLCH is perceptually uniform, so
> two adjacent palette steps look like equal jumps to the eye. Hex/HSL ramps
> bunch unevenly in the dark range.

### R3 — Avoid pure black; prefer near-black

Never use `oklch(0 0 0)` (pure black) for `--foreground` or any text-bearing
semantic token. Use `--neutral-950` (`oklch(0.145 0 0)`) instead. Reserve
`--neutral-1000` for niche cases (overlays, deep shadows) — and even there
prefer rgba/oklch with alpha.

> Why: Apple HIG and Material Design 3 both specify a near-black for body
> text; pure black on pure white is harsh and triggers more vibrating contrast
> on OLED panels. Skip the pain.

### R4 — Dark mode is NOT an inversion

Do not derive dark-mode tokens by mathematically inverting light-mode values.
Tune each dark-mode mapping independently. The current mappings live in the
`.dark` block of `color.css`.

Specifically:
- `--muted-foreground` is **lighter** in dark mode than the inversion would
  suggest, so it stays legible (light: `--neutral-500`, dark: `--neutral-400`).
- Surfaces (`--background`, `--card`, `--popover`) all use `--neutral-950` in
  dark — not `--neutral-1000` — to leave headroom for elevation.

> Why: Radix dark theme spec, Material 3 surface tonal palettes, and Apple
> HIG all explicitly call this out. Inverted palettes produce muddy text and
> harsh surfaces.

### R5 — Signal colors stay vivid in dark mode

Destructive (and any future success / warning / info) must NOT be desaturated
or darkened drastically in dark mode. Current example:

```
--destructive (light) = var(--red-600)   /* oklch(0.577 0.245 …) */
--destructive (dark)  = var(--red-500)   /* oklch(0.637 0.237 …) */
```

The dark mapping uses a *brighter, similarly-saturated* step — not a dark red.

Forbidden anti-pattern:
```
--destructive (dark) = var(--red-900)   /* don't — kills the signal */
```

> Why: signal/status colors carry semantic urgency. A dim red in dark mode
> reads as decorative, not as a warning. shadcn/Radix and Material 3 both
> mandate maintaining chroma on signal colors across themes.

### R6 — WCAG AA contrast on text-bearing semantic pairs

Every `*-foreground` token paired with its surface must hit **≥ 4.5:1**
contrast ratio (AA for body text). Current pairs that matter:

| Pair | Light | Dark |
|------|-------|------|
| foreground / background | neutral-950 on neutral-0 | neutral-50 on neutral-950 |
| muted-foreground / background | neutral-500 on neutral-0 | neutral-400 on neutral-950 |
| primary-foreground / primary | neutral-50 on neutral-900 | neutral-900 on neutral-50 |
| destructive-foreground / destructive | neutral-50 on red-600 | neutral-50 on red-500 |

When introducing a new pair, verify with a contrast checker (Stark, Polypane,
or `oklch.com`) before merging. **3:1 is acceptable only for non-text UI**
(borders, icons, large text > 18pt bold).

> Why: WCAG 2.2 SC 1.4.3 (Contrast Minimum). It is also the floor that
> screen-reader users rely on; below this we lose accessibility certification
> options downstream.

### R7 — Tailwind exposure: `@theme inline` only

When adding a new semantic token, expose it to Tailwind via the `@theme
inline` block in `globals.css`. The `inline` keyword is required.

```css
@theme inline {
  --color-success:            var(--success);
  --color-success-foreground: var(--success-foreground);
}
```

Without `inline`, Tailwind resolves the var once at build time and dark-mode
swapping breaks. Always `inline`.

### R8 — Class-based dark mode

Dark mode is toggled via `<html class="dark">`, wired by:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Do not switch to media-query (`prefers-color-scheme`) dark mode without
explicit discussion — it removes user override capability and breaks any
manual theme toggle.

---

## Workflows

### Adding a new semantic token (e.g. `success`)

1. **Define the palette** if a new hue is needed (Tailwind v4's green ramp is
   a sensible default — copy from `https://tailwindcss.com/docs/colors`).
   Add Tier 1 palette steps to `color.css`:
   ```css
   --green-50:  oklch(...);
   --green-500: oklch(0.723 0.219 149.579);
   --green-600: oklch(0.627 0.194 149.214);
   /* ... */
   ```
2. **Add Tier 2 semantic token** in both `:root` (light) and `.dark` blocks:
   ```css
   :root  { --success: var(--green-600); --success-foreground: var(--neutral-50); }
   .dark  { --success: var(--green-500); --success-foreground: var(--neutral-50); }
   ```
   Apply R5 (vivid in dark), R6 (verify ≥ 4.5:1 contrast for foreground pair).
3. **Expose to Tailwind** via `globals.css` `@theme inline`:
   ```css
   --color-success:            var(--success);
   --color-success-foreground: var(--success-foreground);
   ```
4. **Verify build**: `pnpm build` should succeed without warnings.
5. **Use in components** as `bg-success`, `text-success-foreground`.

### Adding a new palette color (no semantic yet)

Just step 1 above. Don't pre-create semantic tokens speculatively — only when
a real consumer needs them.

### Renaming a palette step

Forbidden unless coordinated. Palette names are referenced from semantic
tokens; a rename is a multi-file refactor. If you must rename, grep for the
old name across `color.css`, `globals.css`, and any docs/skills first.

### Removing a token

Grep usages first:

```bash
grep -rn "bg-<token>\|text-<token>\|border-<token>" apps/web/src
```

If any usage exists, refactor those before removing. Then drop the
`@theme inline` mapping AND the `:root` / `.dark` definitions in `color.css`.

---

## Pitfalls (do NOT do these)

1. Adding tokens speculatively ("we might need warning later"). Wait for the
   real use case — every token is a maintenance contract.
2. Defining a token in only one of `:root` / `.dark`. Both blocks must have
   it, or dark mode falls back unpredictably.
3. Using a Tailwind palette utility (`bg-neutral-500`, `bg-red-700`) in a
   component to "fix" a missing token. Add the proper semantic token instead.
4. Adjusting a palette value to fix one component's contrast issue. The
   palette is the foundation — fix the semantic mapping or add a new token.
5. Hardcoding a hex in `color.css` "temporarily". Temporary becomes permanent.
   Convert to OKLCH before committing (use `oklch.com`).
6. Inverting palette references between themes (`--background` light using
   `--neutral-50`, dark using `--neutral-1000`). Light should use `--neutral-0`,
   dark should use `--neutral-950` — see R3.
7. Dropping the `inline` keyword from `@theme inline`. Dark mode silently
   stops working at runtime (no error).
8. Forgetting to grep usages before removing/renaming a token. CI will not
   catch a missing Tailwind utility — it just renders no color.

---

## References

- Tailwind v4 theme directive: https://tailwindcss.com/docs/theme
- Tailwind v4 colors / OKLCH: https://tailwindcss.com/docs/colors
- Tailwind v4 dark mode: https://tailwindcss.com/docs/dark-mode
- Radix Colors (12-step ramp + dark theme spec): https://www.radix-ui.com/colors
- Material Design 3 color system: https://m3.material.io/styles/color/system/overview
- Apple HIG color: https://developer.apple.com/design/human-interface-guidelines/color
- GitHub Primer color tokens: https://primer.style/foundations/color
- WCAG 2.2 Contrast Minimum: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- OKLCH inspector: https://oklch.com
