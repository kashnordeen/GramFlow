# GramFlow Design System

**Direction:** Obsidian Vault

**Design dials:** Variance 7/10, motion 6/10, density 8/10

## Design read

GramFlow is a business-critical inventory, receivables, and accounting application for daily operators. Obsidian is the default precision-command-center language. Daylight is a complete light companion, not an inverted afterthought. Both use the same hierarchy, restrained lime energy, clear task surfaces, and calm information density.

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

### Daylight companion

| Role | Value |
| --- | --- |
| Canvas | `#F3F6F1` |
| Surface 1 | `#FFFFFF` |
| Surface 2 | `#EDF2EB` |
| Surface 3 | `#E3EBE2` |
| Border | `#D5E0D4` |
| Strong border | `#B9CBB8` |
| Primary text | `#15231A` |
| Secondary text | `#47594C` |
| Muted text | `#627467` |
| Interactive accent | `#476F0B` |
| Analytical accent | `#087B78` |
| Warning | `#9D5200` |
| Critical | `#BB3144` |
| Success | `#14774C` |

The vivid Obsidian lime remains a brand accent on dark feature surfaces. Daylight uses deeper green for small text and buttons so contrast holds.

## Type and shape

- Font stack: Geist, Segoe UI Variable, Segoe UI, system sans-serif.
- Currency, weight, percentages, and time use tabular numerals.
- Controls use 8px corners, standard panels use 12px, and feature panels use 18px.
- Pills are limited to statuses, compact filters, and avatars.
- Icon family: Lucide, already used by the product. Standard strokes are 1.75-2px.

## Interaction rules

- Every action uses a native link or button with a visible focus indicator.
- Desktop and mobile targets are at least 44px where the layout permits touch use.
- Motion communicates hierarchy, feedback, or state. The authentication orbital is the only ambient branded loop; it stops for reduced-motion preferences.
- Animate transform and opacity only. Honor `prefers-reduced-motion`.
- Text contrast in both themes must meet WCAG 2.1 AA. Color is never the sole state indicator.

## Layout rules

- Use asymmetric grids to communicate priority instead of equal card rows.
- Keep dense operational content within a responsive maximum width.
- Desktop navigation is 248px expanded and 76px collapsed.
- Mobile content becomes single-column and clears the fixed bottom navigation plus safe area.
- Avoid decorative fake charts, generic three-card layouts, excessive glow, and repeated rounded containers.
- Operational routes use a shared sequence: context header, focused task panel, supporting context/preview, and an inspectable ledger. Fields have persistent labels and explain consequential behavior before submission.
- Authentication uses a split-screen brand story only at wide widths; tablet and phone become a single-column form without sideways scrolling.
- Preserve business behavior, including FIFO, immutable journals, role permissions, and first-admin-only signup.

## Performance rules

- Preserve server rendering for page structure and initial data.
- Use native CSS and SVG for the spatial visuals. Avoid WebGL and a new animation dependency.
- Reserve layout space for asynchronous content to keep cumulative layout shift low.

## Source of truth

The approved Obsidian direction at `docs/superpowers/specs/2026-09-24-obsidian-vault-ui-design.md` remains the baseline. This file records the approved expansion to every operational route, authentication, and Daylight mode. Page overrides live under `pages/`.
