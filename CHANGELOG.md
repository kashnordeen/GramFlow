# Changelog

All notable changes to GramFlow are documented here.

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
