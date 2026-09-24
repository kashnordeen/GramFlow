# Obsidian Vault UI/UX Design

**Status:** Awaiting written-spec approval

**Date:** 2026-09-24

**Product:** GramFlow
**Initial delivery scope:** Dashboard, shared application shell, and reusable visual foundations

## 1. Intent

GramFlow should feel like a premium operational command center for inventory, sales, receivables, and accounting. The interface must remain fast and practical for daily business use while gaining a distinctive futuristic identity through dark mineral surfaces, purposeful depth, restrained neon accents, meaningful motion, and a single high-quality 3D inventory visualization.

The redesign is successful when a user can answer these questions within a few seconds of opening the dashboard:

1. Is there enough stock to operate?
2. How is the business performing today?
3. What money is still outstanding?
4. What requires action now?
5. How do I record the next sale, stock batch, customer, or payment?

## 2. Scope

### Phase 1: approved foundation

- Replace the current light dashboard with the Obsidian Vault dashboard.
- Redesign the desktop sidebar, mobile navigation, and top command bar.
- Establish shared color, type, spacing, elevation, border, focus, and motion tokens.
- Introduce reusable dashboard primitives rather than page-specific inline styling.
- Add useful empty, loading, error, and low-stock states.
- Extend dashboard data only where required to render truthful comparisons and trends.
- Preserve current authentication, permissions, privacy masking, FIFO behavior, accounting behavior, and route structure.

### Follow-on work, outside Phase 1

- Apply the approved system to stock, sales, transactions, customers, accounting, audit, access control, settings, login, and signup screens.
- Rework page-specific workflows after the shared foundation has been visually and functionally validated.

### Non-goals

- No database-domain redesign.
- No changes to accounting, authorization, inventory-allocation, or audit rules.
- No decorative fake data or charts.
- No full-site WebGL environment.
- No continuous animation that distracts from business tasks.
- No third-party component framework solely for visual styling.

## 3. Design Direction

### Character

The experience should feel precise, calm, and high-value: a dark operations room rather than a gaming interface. Futurism comes from geometry, layering, light, data motion, and spatial relationships—not from a large number of gradients or glowing elements.

### Palette

| Token | Value | Purpose |
| --- | --- | --- |
| `--vault-canvas` | `#080B0A` | Primary application background |
| `--vault-surface-1` | `#111714` | Navigation and standard panels |
| `--vault-surface-2` | `#17201C` | Raised panels and hover states |
| `--vault-surface-3` | `#1D2823` | Selected and emphasized surfaces |
| `--vault-border` | `#29352F` | Default structural border |
| `--vault-border-bright` | `#3B4A43` | Hover and focus-adjacent border |
| `--vault-text` | `#F2F7F4` | Primary text |
| `--vault-text-secondary` | `#B6C1BA` | Supporting text |
| `--vault-text-muted` | `#8E9B94` | Labels and metadata |
| `--vault-lime` | `#C7FF36` | Brand, primary action, stock health |
| `--vault-lime-strong` | `#ADDE2F` | Pressed primary action |
| `--vault-cyan` | `#40E4D4` | Analytical series and informational data |
| `--vault-warning` | `#FFB547` | Warning state |
| `--vault-danger` | `#FF5C68` | Critical state |
| `--vault-success` | `#53D68A` | Confirmed positive state |

Lime is the only primary accent. Cyan is limited to secondary analytical information. Warning, danger, and success colors remain semantic and are always paired with an icon or text label.

### Typography

- Use Geist Sans when available through the existing Next.js font mechanism, with the current system stack as fallback.
- Use tabular numerals for weights, currency, percentages, timestamps, and accounting values.
- One page-level `h1`; section headings follow in order.
- Dashboard KPI values prioritize clarity over extreme size.
- Uppercase is limited to compact metadata labels; body copy remains sentence case.

### Geometry and depth

- Small controls: 8px radius.
- Standard cards and inputs: 12px radius.
- Feature panels and the command centerpiece: 18px radius.
- Pills are reserved for status, filters, compact toggles, and avatars.
- Panels use one-pixel borders plus restrained internal highlights.
- Shadows are used only when a surface moves above another surface.
- Glass effects must preserve readable contrast and degrade gracefully when backdrop filters are unavailable.

## 4. Information Architecture

### Desktop shell

The desktop shell contains a 248px expanded sidebar, a 76px collapsed rail, and a sticky command bar. The user’s collapse preference is remembered locally. Collapsed navigation must expose labels through accessible tooltips.

Navigation is grouped as:

- **Operate:** Dashboard, Add Sale, Transactions, Customers, Stock Vault
- **Control:** Accounting, Audit Log
- **System:** Settings, Access Control

Permission filtering remains unchanged. The active destination uses a slim lime energy rail, a slightly raised surface, and a text/icon color change. The current promotional footer is replaced with a compact FIFO system-status module because operational status is more useful than promotional copy.

### Top command bar

The top command bar contains:

- Current dashboard period and date context.
- A desktop command/search trigger with a keyboard hint.
- `Add stock` as a secondary action when permitted.
- `Record sale` as the primary lime action when permitted.
- Profile and account menu.

Actions not granted by permissions must not render. The bar becomes compact and horizontal-scroll-safe at tablet widths.

### Mobile shell

- Retain a five-position bottom navigation pattern.
- Keep the central Record Sale action prominent only when the user has `sales.create`.
- Use a compact top header for brand, page context, and account access.
- Place less-frequent destinations in a clearly labeled More sheet.
- Respect safe-area insets and ensure content is not hidden behind the bottom navigation.

## 5. Dashboard Experience

### 5.1 Command header

The greeting becomes contextual support rather than the main content. The header communicates:

- Greeting and user name.
- Current date and selected period.
- One concise status sentence such as “2 items need your attention.”
- Primary and secondary operational actions supplied by the shared command bar.

### 5.2 Business Pulse centerpiece

The centerpiece is the visual anchor and the only rich 3D element.

- A layered isometric vault represents available inventory.
- The amount in grams remains the dominant readable value.
- Stock condition is explicit: Healthy, Low, or Out of stock.
- Secondary satellites show sales today, gross profit, and receivables.
- Low and zero stock expose an `Add stock` action instead of a detached warning banner.
- Pointer movement may shift the depth layers by at most 2–3 degrees.
- Keyboard focus produces the same actionable affordance without requiring pointer motion.

The first implementation should use layered SVG and CSS transforms. A WebGL dependency is not justified unless this version cannot meet the approved visual result or performance target.

### 5.3 Decision KPI row

Four cards answer distinct questions:

1. **Sales today:** amount, transaction count, sold grams, and comparison with the previous equivalent period.
2. **Gross profit:** FIFO-derived profit, margin percentage where meaningful, and period comparison.
3. **Available stock:** grams, open batch count, oldest-batch age, and stock condition.
4. **Outstanding:** receivable total, debtor count, and overdue or highest-risk count where the data supports it.

Cards do not all require identical width. Desktop may emphasize sales and stock while keeping profit and outstanding compact. Decorative charts are prohibited; every sparkline or indicator must be generated from real dashboard data.

### 5.4 Trends and stock health

The analytical row contains:

- A two-series Sales and Gross Profit chart with 7-day and 30-day filters.
- A Stock Health panel showing remaining stock by open batch and aging/FIFO order.

The chart must provide accessible summaries and tooltips, readable axes, and a non-color series distinction. If there are too few observations, show an explanatory insufficient-data state rather than inventing a curve.

### 5.5 Action queue

The action queue combines current warnings and opportunities:

- Out of stock or low stock.
- Customers with outstanding balances, prioritized by balance.
- Missing first-sale or first-stock setup steps.
- Any existing operational conditions exposed by current data without changing business rules.

Every item contains a label, consequence, and direct action. Severity is communicated through iconography and text in addition to color.

### 5.6 Recent activity

Use the existing recent sales data to render a compact timeline or table with customer, amount, grams, and time. Privacy masking must continue to cover sensitive values. A permission-aware link opens the full transaction history.

### 5.7 Quick actions

Provide direct permission-aware actions for:

- Record sale
- Add stock batch
- Add customer
- Record or review customer payment through the existing supported flow

Quick actions use compact buttons, not another large card grid.

## 6. Empty, Loading, Error, and Privacy States

### Empty business state

When the dashboard has no stock, sales, customers with balances, or useful trend history, analytics are replaced with a setup path:

1. Add the first stock batch.
2. Create or select a customer.
3. Record the first sale.

Completed steps visibly resolve. The user is never presented with fabricated charts or a screen dominated by zeroes.

### Partial empty state

Panels without enough data show a compact explanation and the action that creates the missing data. Other populated panels continue to render normally.

### Loading

- Use layout-stable skeletons matching final panel dimensions.
- Mark loading regions with `aria-busy` and meaningful labels.
- Avoid full-page spinners for dashboard content.

### Error

- Keep the shell usable if dashboard metrics fail.
- Show a concise inline error with retry guidance.
- Do not reveal internal database details.

### Privacy

- Existing privacy masking remains functional in every new metric, chart tooltip, activity item, and modal.
- Layout dimensions must remain stable when values are masked.

## 7. Motion System

Motion supports orientation and state change:

- Initial panel reveal: 280–420ms with 40–60ms stagger.
- Hover and focus response: 120–180ms.
- Route transition: subtle opacity and 6–10px depth/vertical shift.
- Charts animate only their first meaningful render or a user-requested period change.
- KPI numbers animate when values change, not on every incidental component render.
- Critical alerts may pulse once when introduced; no infinite flashing.
- Sidebar active rail glides between destinations.

All motion uses transform and opacity where possible. `prefers-reduced-motion: reduce` disables tilt, stagger, count-up, chart drawing, and nonessential page motion while preserving immediate state feedback.

## 8. Data Contract

The existing `getDashboardMetrics` result supplies summary totals, recent sales, and debtors. Phase 1 may extend it with a focused dashboard view model containing:

- Previous-period sales amount, count, and grams.
- Daily sales and FIFO-derived profit series for 7 and 30 days.
- Gross profit total rather than lifetime revenue mislabeled as profit.
- Open batch count, remaining quantity per displayed batch, creation date, and oldest-batch age.
- Receivable count and prioritized balances.

Dashboard aggregation stays server-side. The UI receives presentation-ready numeric data and does not reproduce accounting or FIFO calculations in the browser. Queries should remain bounded and execute in parallel where independent. No new endpoint is required unless interactive period switching cannot be implemented cleanly through the current server-action pattern.

## 9. Component Boundaries

Expected reusable units include:

- `AppShell`
- `SidebarNavigation`
- `CommandBar`
- `DashboardHeader`
- `BusinessPulse`
- `MetricCard`
- `TrendChart`
- `StockHealthPanel`
- `ActionQueue`
- `RecentActivity`
- `QuickActions`
- `DashboardEmptyState`
- `StatusBadge`
- `AccessibleTooltip`

Data-fetching and authorization remain in server components/actions. Pointer motion, period controls, tooltips, privacy interactions, and navigation collapse behavior are isolated client components. Components use semantic props and shared tokens instead of large configuration objects or copied inline styles.

## 10. Responsive Rules

### 1440px and above

- Full expanded shell by default.
- Business Pulse spans the primary visual area.
- KPI and analytical panels may use an asymmetric 12-column grid.

### 1024–1439px

- Sidebar may default to compact mode when space is constrained.
- KPI cards use a two-by-two or asymmetric grid.
- Analytics remain side by side where readability permits.

### 768–1023px

- Compact navigation rail or tablet shell.
- Business Pulse and analytical panels stack.
- Primary actions stay visible without crowding the command bar.

### 320–767px

- Mobile top and bottom navigation.
- Single-column content.
- Business Pulse becomes a flatter layered SVG without pointer tilt.
- Charts use a minimum readable height and horizontal labels are reduced deliberately.
- Touch targets are at least 44px.

The implementation must be checked at 320px, 768px, 1024px, and 1440px widths.

## 11. Accessibility

- Meet WCAG 2.1 AA contrast requirements.
- Preserve semantic heading order and landmark structure.
- Every action is a native link or button.
- Provide visible `:focus-visible` treatment using lime with sufficient separation from the background.
- All icon-only controls include accessible names and visual tooltips.
- Charts include a concise text summary and keyboard-accessible detail where interactive.
- Do not use color alone for trends, alerts, or stock condition.
- Dialogs use focus management, Escape handling, and focus restoration.
- Motion respects reduced-motion preferences.
- Privacy controls accurately announce masked/unmasked state.

## 12. Performance Constraints

- No WebGL or animation library in the initial implementation unless measurement proves it is necessary.
- The 3D centerpiece uses optimized inline SVG/CSS and contains no large raster asset.
- Avoid layout thrashing in pointer effects; use animation frames and transform-only updates.
- Do not ship continuous offscreen animations.
- Preserve server rendering for the page structure and initial metrics.
- Avoid introducing a charting dependency if an accessible, maintainable SVG implementation covers the two required dashboard charts.

## 13. Verification and Acceptance Criteria

Phase 1 is accepted when:

- The dashboard visibly follows the Obsidian Vault palette and hierarchy.
- The large empty lower canvas is replaced by truthful analytics, actions, and recent activity or a useful onboarding state.
- A permitted user can reach Record Sale and Add Stock immediately.
- Low and zero stock produce a clear action, not only a warning.
- Lifetime revenue is no longer presented as profit.
- All charts and comparisons use real server data.
- Permission and privacy behavior remain intact.
- The shell and dashboard work at the four target widths.
- Keyboard navigation, focus order, dialogs, tooltips, and reduced motion are verified.
- Loading, full-empty, partial-empty, error, low-stock, and normal-data states have explicit UI coverage.
- Lint, typecheck, automated tests, and production build pass.
- Browser verification finds no console errors and no obvious layout overflow.

## 14. Rejected Patterns

- Purple/blue gradient SaaS styling.
- Neon on every edge or control.
- Uniform grids of interchangeable rounded cards.
- Fake sparklines or misleading trend arrows.
- Heavy blur that lowers text contrast.
- Persistent parallax, floating objects, or looping alert animation.
- Pointer-only information.
- Inline-style proliferation in new components.
- Replacing proven application behavior merely to support the redesign.

## 15. Delivery Sequence

After this written specification is approved, the implementation plan should deliver thin, verifiable slices in this order:

1. Design tokens, type, and shared surface primitives.
2. Responsive application shell and navigation.
3. Dashboard data contract and truthful aggregation.
4. Empty and error states.
5. Business Pulse and KPI hierarchy.
6. Trends, stock health, action queue, activity, and quick actions.
7. Motion, 3D depth, reduced-motion behavior, and final responsive polish.
8. Accessibility, browser, performance, and regression verification.
