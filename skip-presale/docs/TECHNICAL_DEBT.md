# Technical Debt

Last updated: 2026-05-25

## Contracts

- Tests use `any` in helper functions for Hardhat contract instances. This is acceptable for current tests but should be typed with generated Typechain types before audit polish.
- `SkipPresale` owner model is simple `Ownable`; mainnet operations need multisig ownership and documented emergency procedures.
- No onchain role separation exists between pause/finalize/withdraw actions. Simplicity is good, but mainnet governance must compensate with multisig policy.
- Contract events are sufficient for basic analytics but do not emit per-stage breakdown for a multi-stage purchase. Frontend reconstructs allocations from event order.

## Frontend

- Some admin security warning copy is stale and still refers to a frontend guard, even though Admin Auth V1 now exists. It should be updated to describe the real current posture: password-session V1, not full production auth.
- Contract ABIs are exported manually into `apps/web/abi`; release process must require `export:abi` after contract changes.
- FAQ is now client-side to read vesting constants from the contract. This is acceptable, but public static pages should degrade gracefully when contracts are not configured.
- Event analytics are client-loaded and not persisted. This is fine for testnet, but production analytics should use a backend indexer or durable event snapshots.

## Admin

- Admin Auth V1 has HttpOnly session cookies but lacks rate limiting, audit logs, role separation and account lockout.
- Legacy `REFERRAL_ADMIN_SECRET` fallback still exists for scripted API access. It should be revisited before production.
- CSV export is session-protected but not logged.
- Admin dashboard is read-heavy and depends on RPC/event loading quality.

## Database

- Default Prisma schema targets SQLite. A PostgreSQL schema variant exists, but the project should avoid long-term dual-schema drift.
- Backup and restore scripts are not yet implemented.
- No health endpoint currently verifies database connectivity.
- No migration promotion process exists for staging/production.

## Documentation

- Several docs are present and useful, but audit-scope docs are not yet complete.
- Launch copy should be centralized to reduce drift across README, app pages and docs.
- Legal disclaimers are good as engineering placeholders, but they are not a substitute for legal review.

## DevOps

- No CI status was verified in this Phase 1 pass.
- No deployed environment inventory exists.
- No monitoring or alerting config exists.
- No formal deployment log template exists yet.

