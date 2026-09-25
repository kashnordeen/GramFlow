# Changelog

All notable changes to GramFlow are documented here.

## [2.1.1] - 2026-09-26

### Changed

- Replaced the project README with a complete product, architecture, setup, operations, security, testing, deployment, and troubleshooting guide.
- Added an animated, reduced-motion-aware dashboard tour built from the shipped GramFlow interface.

## [2.1.0] - 2026-09-25

### Added

- Optional Google Workspace authentication with PKCE, verified identity claims, and guarded first-admin signup.
- A redesigned responsive operational workspace with command navigation, mobile navigation, theme controls, privacy coverage, loading states, and resilient empty states.
- Dashboard business pulse, truthful sales and profit trends, prioritized action queues, recent activity, and stock-health visibility.
- Whole-batch stock cost entry with internally derived FIFO unit costs and realized-margin reporting.

### Changed

- Expanded the README with Google OAuth setup, cost accounting behavior, and authentication security details.
- Normalized PostgreSQL timestamps at the application boundary for consistent rendering.
- Refined stock, sales, customer, accounting, audit, settings, and access-control experiences across screen sizes.

### Migration notes

- Run `npm run db:migrate` before starting the new version to apply Google identity and total batch-cost migrations.
- Existing per-gram stock costs are converted to whole-batch totals automatically by migration `005_total_batch_cost.sql`.
- Google sign-in remains disabled unless `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` are configured.

## [2.0.0] - 2026-09-18

### Added

- PostgreSQL migrations, deterministic seed data, Docker setup, and SQLite import tooling.
- Concurrency-safe FIFO inventory allocation and balanced double-entry accounting journals.
- Persisted role-based access control, immutable audit history, and automatic session expiry.
- Health, backup, ledger export, settings, accounting, audit, and role-administration workflows.
- Unit, security, authorization, and PostgreSQL integration tests with GitHub Actions CI.

### Changed

- Reworked the application interface, navigation, customer, sales, stock, and transaction flows.
- Hardened authentication, authorization, database integrity, deployment guidance, and release documentation.
- Standardized PostgreSQL as the only runtime database.

### Removed

- Runtime SQLite database artifacts and legacy middleware.
