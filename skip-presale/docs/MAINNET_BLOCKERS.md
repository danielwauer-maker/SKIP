# Mainnet Blockers

Last updated: 2026-05-25

Mainnet is currently **NO-GO**.

## Blocking Items

### 1. External Security Audit

Status: Open

Required:

- provide audit scope,
- provide mechanics documentation,
- freeze audited commit,
- resolve critical/high findings,
- publish or summarize audit status accurately.

### 2. Multisig Ownership

Status: Open

Required:

- choose multisig provider and signer set,
- define signer policy,
- deploy multisig,
- transfer `SkipToken`, `SkipPresale`, `SkipTeamVesting` ownership where applicable,
- document owner-only actions and emergency procedures.

### 3. Treasury and Withdrawal Governance

Status: Open

Required:

- document treasury destination wallet,
- define development withdrawal policy,
- define repayment procedure if refund path needs liquidity,
- rehearse withdrawals and repayment on testnet.

### 4. Production Database and Backups

Status: Open

Required:

- choose hosted PostgreSQL provider,
- run migrations against staging,
- add backup script,
- add restore procedure,
- perform restore drill,
- define retention policy.

### 5. Monitoring and Incident Response

Status: Open

Required:

- monitor web health,
- monitor admin API failures,
- monitor contract events,
- monitor RPC failures,
- alert on unexpected owner actions,
- prepare incident response runbook.

### 6. Admin Security Hardening

Status: Open

Required:

- add rate limiting to login/admin APIs,
- add admin audit log,
- remove or tightly document legacy secret-header fallback,
- consider role separation for read-only analytics vs operational controls,
- define production session secret rotation procedure.

### 7. Legal and Compliance Review

Status: Open

Required:

- review sale copy and risk language,
- review user eligibility,
- decide geofencing/KYC/AML posture,
- review disclaimers and terms,
- confirm no misleading investment, listing, airdrop or reward language.

### 8. Mainnet Deployment Dry Run

Status: Open

Required:

- run local E2E flow,
- run Amoy mock dry-run,
- run Amoy USDC-address dry-run if applicable,
- verify contract source,
- verify frontend constants and addresses,
- complete go/no-go checklist.

## Non-Blocking for Public Testnet

These are not mainnet-ready but can be acceptable for public testnet with clear warnings:

- Admin Auth V1 if admin route is not broadly exposed.
- SQLite for local only, PostgreSQL staged later.
- MockUSDC Amoy deployment if all copy clearly states no real funds.
- Referral/XP V1 with basic anti-abuse only.

