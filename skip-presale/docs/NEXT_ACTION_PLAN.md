# Next Action Plan

Last updated: 2026-05-25

## Operating Principle

Move toward public testnet first, then mainnet readiness. Do not deploy mainnet, collect real funds or publish legally sensitive claims without explicit human approval and legal review.

## Phase 2: Contract Hardening

1. Add ownership transfer tests for `SkipToken`, `SkipPresale`, `SkipTeamVesting` and `MockUSDC`.
2. Add tests proving non-owner cannot pause, unpause, finalize, withdraw development funds, withdraw remaining funds or withdraw unsold tokens.
3. Add tests for finalize edge timing at exactly `endTime` and `endTime + 1`.
4. Add tests around refund after partial development withdrawal and partial repayment.
5. Add tests for `withdrawUnsoldTokens` after partial buyer claims over time.
6. Type Hardhat test helpers with Typechain types.
7. Create `docs/AUDIT_SCOPE.md` and `docs/PRESALE_MECHANICS.md` from contract behavior.

## Phase 3: Frontend Trust Layer

1. Add a contract address panel with copy links and explorer links.
2. Update stale admin warning copy to reflect Admin Auth V1 accurately.
3. Add an audit/multisig status panel that is explicit and conservative.
4. Ensure claim/refund explanations are visible near dashboard actions.
5. Add a public risk strip to presale and dashboard pages if not already visible in first viewport.

## Phase 4: Admin Hardening

1. Add login/admin API rate limiting.
2. Add admin audit log table and write logs for login/logout/export/admin summary access.
3. Add production warning if `ADMIN_PASSWORD` is short or `ADMIN_SESSION_SECRET` is missing/short.
4. Decide whether `REFERRAL_ADMIN_SECRET` remains allowed in production.
5. Add CSV export logging without storing secrets.

## Phase 5: Database/Production

1. Add PostgreSQL backup script.
2. Add restore procedure document.
3. Add database health endpoint for admin/internal use.
4. Validate Prisma PostgreSQL schema against local Docker Postgres.
5. Create staging migration checklist.

## Phase 6: Audit Package

Create:

- `docs/AUDIT_SCOPE.md`
- `docs/THREAT_MODEL.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/PRESALE_MECHANICS.md`
- `docs/VESTING_MODEL.md`
- `docs/REFUND_MODEL.md`
- `docs/ADMIN_ROLES.md`
- `docs/DEPLOYMENT_ASSUMPTIONS.md`
- `docs/AUDITOR_README.md`

## Phase 7: Mini-Testnet / Dry Run

1. Run local E2E with fresh deployment addresses.
2. Run Amoy mock deployment and record outputs.
3. Complete manual test checklist with at least two wallets.
4. Create deployment log template.
5. Create go/no-go checklist.

## Phase 8: Launch Communication

1. Centralize legal-safe copy fragments.
2. Add no-return, no-listing and no-airdrop disclaimer snippets.
3. Prepare community post templates for testnet participation only.
4. Avoid investment framing and avoid guaranteed future eligibility language.

## Immediate Next Step

Start Phase 2 by adding ownership/access-control tests and finalization/refund edge tests. This is low risk, improves audit confidence and does not change deployed behavior.

