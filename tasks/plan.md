# Implementation Plan: Obsidian Vault UI/UX

## Overview

Implement the approved Obsidian Vault foundation as a dashboard-first redesign. The work preserves GramFlow's current routes, authorization, privacy controls, FIFO logic, and accounting behavior while replacing the shared shell and dashboard with an accessible dark command-center experience. Tasks are tracked in [`tasks/todo.md`](todo.md).

## Architecture Decisions

- Keep the dashboard page server-rendered. Server actions produce a presentation-ready dashboard view model; the browser does not reproduce FIFO or accounting calculations.
- Use a `period=7|30` URL search parameter for trend selection. This keeps the state shareable and avoids a new dashboard API.
- Calculate gross profit from posted sales minus assigned FIFO cost (`grams_deducted * unit_cost`). The current lifetime-revenue-as-profit calculation is removed.
- Use CSS Modules for the new shell and dashboard composition while retaining global semantic tokens and compatibility styles needed by untouched pages.
- Build the 3D centerpiece with layered inline SVG and CSS transforms. Do not add WebGL or an animation dependency.
- Build the two required charts as accessible SVG components. Do not add a charting dependency unless implementation proves the native approach unmaintainable.
- Keep interactive client islands narrow: sidebar state, command palette, pointer depth, privacy controls, tooltips, and period interaction. Page structure and initial data stay on the server.
- Keep existing permission filtering authoritative. Links and actions render only when the session includes their required permission.
- Preserve the current 5g low-stock threshold during Phase 1 because no persisted threshold setting exists.
- Treat receivable priority as balance-based. The schema has no due date, so the UI must not claim a balance is overdue.

## Dependency Graph

```text
Approved design specification
    |
    +-- Obsidian tokens and primitives
    |       |
    |       +-- Responsive navigation shell
    |       +-- Command bar and command palette
    |
    +-- Dashboard view model and SQL semantics
            |
            +-- Empty/loading/error states
            +-- Business Pulse and decision KPIs
            +-- Trend and stock-health panels
            +-- Action queue, recent activity, and quick actions
                    |
                    +-- Motion and responsive refinement
                            |
                            +-- Accessibility/browser/regression gate
```

## Task List

### Phase 1: Visual foundation

- [ ] Task 1: Establish the Obsidian token and surface foundation
- [ ] Task 2: Deliver the responsive navigation shell
- [ ] Task 3: Deliver the permission-aware command bar and palette

### Checkpoint: Shared shell

- [ ] Existing routes remain reachable according to permissions
- [ ] Desktop, tablet, and mobile shell layouts render without overflow
- [ ] Lint and typecheck pass

### Phase 2: Truthful dashboard data and states

- [ ] Task 4: Build the dashboard view model and correct profit semantics
- [ ] Task 5: Deliver loading, error, empty, and partial-empty states

### Checkpoint: Data and resilience

- [ ] Dashboard integration tests cover totals, profit, trends, and empty data
- [ ] Privacy and permission behavior remains intact
- [ ] Full automated test suite passes

### Phase 3: Command-center dashboard

- [ ] Task 6: Deliver Business Pulse and decision KPIs
- [ ] Task 7: Deliver sales/profit trends and stock health
- [ ] Task 8: Deliver the action queue, recent activity, and quick actions

### Checkpoint: Core experience

- [ ] Normal, low-stock, out-of-stock, and no-data flows work end to end
- [ ] Every visualized value comes from real server data
- [ ] Dashboard actions respect permissions

### Phase 4: Finish and verification

- [ ] Task 9: Apply purposeful motion and responsive refinement
- [ ] Task 10: Complete accessibility, browser, performance, and regression verification

### Checkpoint: Complete

- [ ] Lint, typecheck, tests, and production build pass
- [ ] Browser console is clean at 320px, 768px, 1024px, and 1440px
- [ ] Keyboard navigation, focus management, privacy masking, and reduced motion pass manual review
- [ ] Result is ready for user visual review

## Verification Strategy

- Focused data verification: `npm exec tsx -- --test tests/dashboard.test.ts`
- Full unit and integration verification: `npm test`
- Static verification: `npm run lint` and `npm run typecheck`
- Production verification: `npm run build`
- Browser verification: use the running application at 320px, 768px, 1024px, and 1440px; inspect console errors, keyboard order, responsive overflow, normal/empty/error states, and reduced motion.
- Visual comparison: confirm the implementation matches the approved Obsidian palette, hierarchy, restrained glow, and single-centerpiece 3D rule rather than merely converting existing cards to dark colors.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Dashboard queries become expensive | High | Use bounded grouped queries, parallelize independent queries, cap stock/debtor detail, and inspect query behavior before adding UI complexity. |
| Profit is miscomputed by joining sales to multiple assignments | High | Aggregate cost per sale before combining it with sale revenue; cover partial multi-batch sales and reversed sales in integration tests. |
| Global dark tokens break untouched pages | High | Add Obsidian semantic tokens without removing legacy aliases; scope new shell/dashboard styles through CSS Modules and visually smoke-test an untouched route. |
| 3D and motion reduce performance | Medium | Use SVG/CSS transform-only effects, pause offscreen work, avoid WebGL, and disable nonessential motion for reduced-motion users. |
| Command palette exposes unauthorized routes | High | Generate available commands from the same permission-aware navigation model and retain server-side authorization. |
| Mobile actions collide with safe areas | Medium | Include safe-area padding and verify bottom-navigation clearance at 320px. |
| Zero-filled trend data is mistaken for observed sales | Medium | Label the date range clearly and distinguish valid zero activity from insufficient history in the accessible summary. |

## Open Questions

No blocking product questions remain. The approved specification and existing schema determine the Phase 1 behavior. Any newly discovered requirement that changes routes, business rules, or stored data requires a design update before implementation continues.

## Execution Method

Recommended: implement sequentially in this thread, stopping at the four recorded checkpoints for verification. Shared styling and dashboard composition overlap heavily, so parallel edits would add merge risk without meaningful speedup.
