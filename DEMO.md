# GramFlow five-minute demo

## Prepare once

1. Copy `.env.example` to `.env` and configure PostgreSQL, a 32+ character JWT secret, the allowed email domain, stock cost, and a demo-only password.
2. Run `npm run db:setup`.
3. Run `npm run db:seed:demo` against a disposable local database.
4. Run `npm run dev` and verify `http://localhost:3000/api/health` returns `{"status":"ok"}`.

The demo accounts are `admin@<ALLOWED_EMAIL_DOMAIN>`, `manager@…`, `inventory@…`, and `accountant@…`. They all use `DEMO_SEED_PASSWORD`. Never enable these fixtures in production.

## Walkthrough

1. Sign in as the manager and show the dashboard, sample customers, two dated stock batches, and the demonstration credit sale.
2. Open Transactions and point out the exact batch allocation. Create a new sale large enough to cross the oldest and newest batches.
3. Open Customers, receive a partial payment, and show the updated receivable.
4. Sign in as the accountant. Open Accounting, expand the sale and payment entries, and show equal debits and credits.
5. Open Audit Log and show the actor, action, entity, timestamp, and metadata.
6. Sign in as the administrator. Open Access Control, create a user, assign a role, and show permission-aware navigation.
7. Reverse the new sale. Confirm the exact stock returns, the customer balance changes, and reversal journals/audit events remain immutable.

## Claims supported by the demo

- PostgreSQL-only runtime with deterministic migrations
- Transactional FIFO allocation with row locks
- Exact sale-to-batch lineage
- Double-entry sale, COGS, payment, adjustment, and reversal journals
- Immutable accounting and audit history
- Database-backed RBAC and permission-aware UI
- One-time admin bootstrap, login throttling, secure cookies, and session invalidation
