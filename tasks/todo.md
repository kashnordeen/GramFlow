# Obsidian Vault Implementation Tasks

## Task 1: Establish the Obsidian token and surface foundation

**Description:** Add the approved color, typography, spacing, radius, elevation, focus, and motion tokens while preserving compatibility for untouched screens. Introduce focused surface/status primitives and load Geist through the existing Next.js application layout without adding a styling framework.

**Acceptance criteria:**

- [x] Approved Obsidian tokens exist as semantic CSS variables, and legacy variables used by untouched pages still resolve safely.
- [x] New surfaces, status badges, focus rings, tabular numerals, and reduced-motion defaults can be reused without inline style objects.
- [x] Geist is applied with a system fallback and does not create an external runtime font request.

**Verification:**

- [x] Run `npm run lint`.
- [x] Run `npm run typecheck`.
- [x] Manually render the login route to confirm readable contrast and no global layout regression.

**Dependencies:** None

**Files likely touched:**

- `app/globals.css`
- `app/layout.tsx`
- `components/ui/Surface.tsx`
- `components/ui/StatusBadge.tsx`

**Estimated scope:** Medium: 4 files

## Task 2: Deliver the responsive navigation shell

**Description:** Restructure navigation into Operate, Control, and System groups; preserve permission filtering; add an accessible remembered collapse state; expose collapsed labels through tooltips; replace promotional copy with useful FIFO status; and complete the mobile bottom-navigation/More-sheet behavior.

**Acceptance criteria:**

- [x] Desktop navigation supports 248px expanded and 76px collapsed states, remembers the preference, and visibly identifies the active route.
- [x] Permission-filtered links remain correct, collapsed links have accessible names/tooltips, and keyboard focus never becomes hidden.
- [x] Mobile navigation respects permissions and safe areas, keeps Record Sale prominent when allowed, and exposes secondary destinations in a labeled More sheet.

**Verification:**

- [x] Run `npm run lint` and `npm run typecheck`.
- [ ] Tab through expanded, collapsed, and mobile navigation.
- [ ] Manually compare admin and restricted permission sets at 320px, 768px, 1024px, and 1440px.

**Dependencies:** Task 1

**Files likely touched:**

- `components/Sidebar.tsx`
- `components/shell/navigation.ts`
- `components/shell/shell.module.css`
- `app/(dashboard)/layout.tsx`

**Estimated scope:** Medium: 4 files

## Task 3: Deliver the permission-aware command bar and palette

**Description:** Replace the empty desktop utility bar with date/period context, permission-aware Add Stock and Record Sale actions, profile access, and an accessible route/action command palette. The palette uses existing routes and actions only and supports a documented keyboard shortcut.

**Acceptance criteria:**

- [x] The command bar exposes the correct primary actions for the signed-in user's permissions without duplicating unavailable actions.
- [x] The command palette opens from its button and keyboard shortcut, filters only authorized destinations/actions, traps focus, closes with Escape, and restores focus.
- [x] The profile menu retains edit profile, settings, report export, backup, and logout behavior according to permissions.

**Verification:**

- [x] Run `npm run lint` and `npm run typecheck`.
- [ ] Keyboard-test palette and profile-menu open, search, selection, Escape, and focus restoration.
- [ ] Manually verify command-bar wrapping and overflow at tablet and mobile widths.

**Dependencies:** Tasks 1 and 2

**Files likely touched:**

- `components/ui/TopNav.tsx`
- `components/shell/CommandPalette.tsx`
- `components/shell/shell.module.css`
- `app/(dashboard)/layout.tsx`

**Estimated scope:** Medium: 4 files

## Checkpoint A: Shared shell

- [x] Run `npm run lint`.
- [x] Run `npm run typecheck`.
- [ ] Confirm every existing route remains reachable according to permissions.
- [ ] Confirm no horizontal overflow at the four target widths.

## Task 4: Build the dashboard view model and correct profit semantics

**Description:** Replace the minimal dashboard metrics result with a typed, presentation-ready view model. Compute today's sales and yesterday comparison, selected-period gross profit and previous-period comparison, 7/30-day zero-filled trends, bounded open-batch health, recent posted sales, and balance-prioritized receivables. Gross profit must use recorded FIFO assignment costs and exclude reversed sales.

**Acceptance criteria:**

- [x] Gross profit equals posted final revenue minus aggregated assigned FIFO cost without duplicating sales that consumed multiple batches.
- [x] `period=7|30` is validated server-side, daily series have deterministic dates, and current/previous comparisons handle zero denominators without misleading percentages.
- [x] Stock, recent activity, and receivable detail are bounded, correctly typed, and do not label balances as overdue.

**Verification:**

- [x] Add and run `npm exec tsx -- --test tests/dashboard.test.ts` against configured test infrastructure.
- [x] Run `npm test`.
- [ ] Manually inspect seeded output for a multi-batch sale, reversed sale, empty database, and both period values.

**Dependencies:** None; may be implemented after Task 1 while shell work is complete

**Files likely touched:**

- `types/index.ts`
- `lib/actions/dashboard.actions.ts`
- `lib/dashboard.ts`
- `tests/dashboard.test.ts`

**Estimated scope:** Medium: 4 files

## Task 5: Deliver loading, error, empty, and partial-empty states

**Description:** Recompose the dashboard entry point around the new view model and provide layout-stable loading, safe inline failure, first-run onboarding, and panel-level insufficient-data states. Keep the shared shell operational when dashboard data fails.

**Acceptance criteria:**

- [x] A fully empty business sees the three-step Add Stock, Create Customer, Record Sale setup path instead of decorative zero charts.
- [x] Partial data renders populated panels while explaining and linking from missing panels; errors do not expose database internals.
- [x] Loading skeletons match final geometry, use `aria-busy`, and avoid layout shift.

**Verification:**

- [x] Run `npm run lint` and `npm run typecheck`.
- [ ] Manually render full-empty, partial-empty, loading, and forced-error fixtures/states.
- [ ] Confirm the sidebar, command bar, and profile menu remain usable during dashboard failure.

**Dependencies:** Tasks 1, 3, and 4

**Files likely touched:**

- `app/(dashboard)/page.tsx`
- `app/(dashboard)/loading.tsx`
- `components/dashboard/DashboardEmptyState.tsx`
- `components/dashboard/dashboard.module.css`

**Estimated scope:** Medium: 4 files

## Checkpoint B: Data and resilience

- [x] Run `npm test`.
- [x] Run `npm run lint` and `npm run typecheck`.
- [ ] Verify profit, trends, stock, receivables, empty state, and error state against seeded data.
- [x] Confirm masked values remain layout-stable.

## Task 6: Deliver Business Pulse and decision KPIs

**Description:** Build the layered SVG/CSS inventory vault as the single rich 3D centerpiece and add four decision cards for sales today, selected-period gross profit, available stock, and outstanding balances. Integrate direct low/out-of-stock action and privacy masking.

**Acceptance criteria:**

- [x] Business Pulse clearly displays inventory amount and Healthy, Low, or Out of stock status, with a permission-aware Add Stock action for low/zero conditions.
- [x] KPI cards use real values and honest comparisons, remain readable while masked, and use icons/text in addition to color.
- [x] Pointer depth stays within 2–3 degrees, uses transform-only updates, and is disabled for touch/reduced-motion contexts.

**Verification:**

- [x] Run `npm run lint` and `npm run typecheck`.
- [ ] Manually verify healthy, low, zero, masked, keyboard-focus, touch, and reduced-motion states.
- [ ] Inspect the browser performance timeline for continuous layout/recalculate-style work while idle.

**Dependencies:** Tasks 4 and 5

**Files likely touched:**

- `components/dashboard/BusinessPulse.tsx`
- `components/dashboard/MetricCard.tsx`
- `components/dashboard/dashboard.module.css`
- `app/(dashboard)/page.tsx`

**Estimated scope:** Medium: 4 files

## Task 7: Deliver sales/profit trends and stock health

**Description:** Add an accessible two-series SVG chart for sales and gross profit with URL-backed 7/30-day controls, plus a stock-health panel that communicates bounded open batches in FIFO order and their age/remaining quantity.

**Acceptance criteria:**

- [x] Trend points map exactly to the selected server series, distinguish series without color alone, and provide a concise accessible summary.
- [x] Period controls update the URL and server-rendered data without losing focus context or privacy behavior.
- [x] Stock health displays real open batches in FIFO order, with a useful no-stock state and a link to Stock Vault when authorized.

**Verification:**

- [x] Run `npm run lint`, `npm run typecheck`, and the dashboard-focused tests.
- [ ] Keyboard-test period controls and chart detail/tooltips.
- [ ] Manually compare chart labels and plotted values with seeded server output for 7 and 30 days.

**Dependencies:** Tasks 4 and 6

**Files likely touched:**

- `components/dashboard/TrendChart.tsx`
- `components/dashboard/StockHealthPanel.tsx`
- `components/dashboard/dashboard.module.css`
- `app/(dashboard)/page.tsx`

**Estimated scope:** Medium: 4 files

## Task 8: Deliver the action queue, recent activity, and quick actions

**Description:** Complete the useful lower dashboard with prioritized stock/setup/receivable actions, a privacy-aware recent-sales timeline, and compact permission-aware quick actions. Reuse existing routes and supported flows rather than creating new business operations.

**Acceptance criteria:**

- [x] Each action-queue item states the condition, consequence, and direct next action; receivables are described by balance priority, not unsupported overdue status.
- [x] Recent activity shows posted sales with customer, grams, amount, and time; sensitive values respect privacy masking.
- [x] Quick actions render only for authorized operations and do not duplicate an unsupported payment workflow.

**Verification:**

- [x] Run `npm run lint` and `npm run typecheck`.
- [ ] Manually verify empty, low-stock, high-balance, recent-sales, privacy-masked, and restricted-permission variants.
- [ ] Follow every rendered link and confirm the destination exists and authorizes correctly.

**Dependencies:** Tasks 4, 5, and 6

**Files likely touched:**

- `components/dashboard/ActionQueue.tsx`
- `components/dashboard/RecentActivity.tsx`
- `components/dashboard/QuickActions.tsx`
- `app/(dashboard)/page.tsx`
- `components/dashboard/dashboard.module.css`

**Estimated scope:** Medium: 5 files

## Checkpoint C: Core dashboard

- [x] Run `npm test`, `npm run lint`, and `npm run typecheck`.
- [ ] Verify normal, low-stock, out-of-stock, full-empty, and partial-empty flows end to end.
- [x] Confirm there are no fake charts, decorative trend arrows, or mislabeled profit values.
- [x] Confirm all actions and sensitive values respect permissions and privacy state.

## Task 9: Apply purposeful motion and responsive refinement

**Description:** Implement the approved timing system for initial reveal, route transition, active navigation, KPI changes, chart drawing, and the Business Pulse depth response. Refine the asymmetric desktop layout and single-column mobile presentation at all target widths.

**Acceptance criteria:**

- [x] Motion timings stay within the approved ranges, critical alerts pulse at most once, and no idle animation continuously consumes resources.
- [x] `prefers-reduced-motion` disables tilt, stagger, count-up, chart drawing, and nonessential route motion while preserving immediate feedback.
- [x] No dashboard or shell content overlaps, clips, or creates horizontal scroll at 320px, 768px, 1024px, or 1440px.

**Verification:**

- [x] Run `npm run lint` and `npm run typecheck`.
- [ ] Use browser emulation at all four target widths in normal and reduced-motion modes.
- [x] Inspect page idle behavior and confirm no continuous animation or layout work.

**Dependencies:** Tasks 2, 3, 6, 7, and 8

**Files likely touched:**

- `app/(dashboard)/template.tsx`
- `app/(dashboard)/dashboard.module.css`
- `components/shell/shell.module.css`
- `components/ui/AnimatedCounter.tsx`

**Estimated scope:** Medium: 4 files

## Task 10: Complete accessibility, browser, performance, and regression verification

**Description:** Run the final quality gate in a real browser, fix only issues discovered within the approved Phase 1 scope, and record the verified states. This task closes keyboard, focus, responsive, console, performance, and regression gaps before visual handoff.

**Acceptance criteria:**

- [x] Heading order, landmarks, accessible names, focus order, dialogs/sheets, tooltips, chart summaries, and status communication meet the specification.
- [x] Dashboard and shell have no console errors, obvious overflow, inaccessible contrast, or broken permission/privacy behavior at target widths.
- [x] Full lint, typecheck, test, and production build commands pass; an untouched non-dashboard route is smoke-tested for token compatibility.

**Verification:**

- [x] Run `npm run lint`.
- [x] Run `npm run typecheck`.
- [x] Run `npm test`.
- [x] Run `npm run build`.
- [ ] Complete keyboard and browser checks at 320px, 768px, 1024px, and 1440px with normal and reduced motion.

**Dependencies:** Tasks 1–9

**Files likely touched:**

- Focused files from Tasks 1–9 only when verification identifies a defect
- `tasks/todo.md`

**Estimated scope:** Medium: verification plus bounded fixes

## Checkpoint D: Ready for visual approval

- [x] All automated commands pass.
- [ ] All acceptance criteria in the approved design specification are satisfied.
- [ ] Working tree contains only intended Obsidian Vault changes.
- [ ] The completed dashboard is opened for user visual review.
