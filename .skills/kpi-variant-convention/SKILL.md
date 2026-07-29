---
name: kpi-variant-convention
description: Add a new KPI card variant to the financial dashboard (frontend/src/components/dashboard) without missing a required touch-point — type union, style map, CSS color tokens for both themes, and row wiring. Use when a PM/feature request adds a new metric to the KPI row (e.g. "expenses", "ROI", "cash runway").
license: MIT
metadata:
  author: nestornegrin
  version: "1.0.0"
---

# KPI Variant Convention

## Objective

This dashboard renders each top-line metric (Total Income, Total Outcome,
Profit, Profit Margin) as a `KPICard` whose color comes from a `variant` prop,
not from an arbitrary className. Adding a new KPI (e.g. "Expenses Ratio")
requires touching **four specific places in a fixed order**. Skipping one
produces a card that either fails to type-check or renders with no color
token (falls back to transparent/unstyled). This skill exists because no
generic React or accessibility skill knows about this project's specific
variant → CSS token wiring — it is not a general React pattern, it is this
codebase's convention.

## Inputs

- `variantName`: the new variant identifier, camelCase, e.g. `expensesRatio`.
- `sharesPaletteWith`: an existing variant (`income` | `outcome` | `profit`)
  whose color the new one should reuse, OR `"new"` if it needs its own
  color pair. Precedent: `profitPercent` intentionally reuses the `profit`
  palette (`--profit-badge` / `--profit-badge-fg`) rather than defining its
  own — a percentage of profit is still "profit-colored" in this design.

## What to change, in order

1. **`frontend/src/components/dashboard/kpi-card.tsx`**
   - Add `variantName` to the `KPICardProps['variant']` union.
   - Add an entry to `variantStyles` pointing at the CSS tokens:
     ```ts
     variantName: {
       badge: 'bg-[var(--{token}-badge)] text-[var(--{token}-badge-fg)]',
       icon: 'text-[var(--{token}-badge-fg)]',
     },
     ```
     where `{token}` is `sharesPaletteWith` if reusing a palette, or
     `variantName` (kebab-case) if it needs new tokens.

2. **`frontend/src/index.css`** — only if `sharesPaletteWith === "new"`.
   Define the pair in **both** the light block (`:root`, ~line 34-39) and the
   dark block (`.dark`, ~line 70-75) — this app forces `dark` via
   `App.tsx`'s `className="dark ..."`, so the dark values are what actually
   renders, but both must exist or `npm run build` / Tailwind's token
   resolution will fall back to an unstyled badge in light mode too:
     ```css
     --{token}-badge: oklch(...);
     --{token}-badge-fg: oklch(...);
     ```

3. **`frontend/src/components/dashboard/kpi-row.tsx`**
   - Add a `<KPICard />` call with `label`, `value`, `helperText`, `icon`
     (a `lucide-react` icon imported at the top, decorative — see the
     `accessibility` skill for why it needs no extra `aria-*`: `KPICard`
     already renders it with `aria-hidden="true"`), and `variant={variantName}`.

4. **`frontend/src/lib/financial-types.ts` / `financial-utils.ts`** — only if
   the new KPI needs a new computed value. Add the field to `KPIMetrics` and
   compute it in `computeKPIs` in the same single pass already used for
   `totalIncome`/`totalOutcome` (see the `js-combine-iterations` fix from
   `vercel-react-best-practices` — do not add a second `.filter()` pass).

## Acceptance criteria

- [ ] `npx tsc -b` (or `npm run build`) passes with no new TypeScript errors —
      a variant missing from `variantStyles` is a type error, not a silent bug.
- [ ] If new CSS tokens were added, they exist in **both** `:root` and `.dark`
      blocks in `index.css`.
- [ ] If new colors were introduced (not reusing an existing palette), the
      badge foreground/background pair passes WCAG AA (4.5:1) in dark mode —
      compute with the same oklch → sRGB → relative-luminance method used to
      verify the existing tokens (documented in `memory-bank/progress.md`),
      don't eyeball it.
- [ ] The new `KPICard` appears in `KPIRow` with a real icon, not a
      placeholder, and the icon is decorative (`aria-hidden="true"`, already
      the default inside `KPICard`).
- [ ] `npx vitest run` still passes (no regression in `financial-utils.test.ts`).

## Non-goals

This skill does not cover adding a new **chart** (a different component
family with its own Recharts wiring) or changing the KPI row's grid layout —
only adding one more color-coded metric card to the existing row.
