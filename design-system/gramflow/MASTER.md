# GramFlow Design System

**Direction:** Obsidian Vault

**Design dials:** Variance 7/10, motion 6/10, density 8/10

## Design read

GramFlow is a business-critical inventory, receivables, and accounting application for daily operators. It uses a dark precision-command-center language with restrained lime energy, calm information density, and one purposeful spatial visualization.

## Core tokens

| Role | Value |
| --- | --- |
| Canvas | `#080B0A` |
| Surface 1 | `#111714` |
| Surface 2 | `#17201C` |
| Surface 3 | `#1D2823` |
| Border | `#29352F` |
| Strong border | `#3B4A43` |
| Primary text | `#F2F7F4` |
| Secondary text | `#B6C1BA` |
| Muted text | `#8E9B94` |
| Brand accent | `#C7FF36` |
| Analytical accent | `#40E4D4` |
| Warning | `#FFB547` |
| Critical | `#FF5C68` |
| Success | `#53D68A` |

## Type and shape

- Font stack: Geist, Segoe UI Variable, Segoe UI, system sans-serif.
- Currency, weight, percentages, and time use tabular numerals.
- Controls use 8px corners, standard panels use 12px, and feature panels use 18px.
- Pills are limited to statuses, compact filters, and avatars.
- Icon family: Lucide, already used by the product. Standard strokes are 1.75-2px.

## Interaction rules

- Every action uses a native link or button with a visible focus indicator.
- Desktop and mobile targets are at least 44px where the layout permits touch use.
- Motion communicates hierarchy, feedback, or state. It never loops without an operational reason.
- Animate transform and opacity only. Honor `prefers-reduced-motion`.
- Dark text contrast must meet WCAG 2.1 AA. Color is never the sole state indicator.

## Layout rules

- Use asymmetric grids to communicate priority instead of equal card rows.
- Keep dense operational content within a responsive maximum width.
- Desktop navigation is 248px expanded and 76px collapsed.
- Mobile content becomes single-column and clears the fixed bottom navigation plus safe area.
- Avoid decorative fake charts, generic three-card layouts, excessive glow, and repeated rounded containers.

## Performance rules

- Preserve server rendering for page structure and initial data.
- Use native CSS and SVG for the dashboard visuals. No WebGL or animation dependency in Phase 1.
- Reserve layout space for asynchronous content to keep cumulative layout shift low.

## Source of truth

The approved design specification at `docs/superpowers/specs/2026-09-24-obsidian-vault-ui-design.md` takes precedence over generated recommendations. Page overrides live under `pages/`.
