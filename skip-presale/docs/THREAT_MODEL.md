# Threat Model

Last updated: 2026-05-25

## Assets

- Buyer USDC contributions.
- Buyer SKIP allocations and future claim rights.
- Presale SKIP inventory held by `SkipPresale`.
- Team vesting allocation held by `SkipTeamVesting`.
- Owner authority over pause, finalize and withdrawals.
- Admin dashboard data and referral database.
- Public trust in sale status, risk disclosures and deployed addresses.

## Actors

| Actor | Capability |
| --- | --- |
| Buyer | Approves USDC, buys SKIP, claims or refunds when enabled. |
| Owner | Pauses/unpauses, finalizes, withdraws development funds, withdraws remaining funds, withdraws unsold tokens. |
| Treasury/operator | May receive development funds and repay them if refund liquidity is needed. |
| Admin user | Reads admin analytics and exports referral/XP data. |
| External attacker | Attempts overbuy, overclaim, double refund, replay, frontend spoofing, API abuse or admin brute force. |
| RPC/indexing failure | Can cause incomplete frontend/admin state without changing onchain truth. |

## Trust Boundaries

- Smart contracts are the source of truth for sale funds, purchases, vesting, claims and refunds.
- Frontend is a convenience interface and must not be treated as a security boundary.
- Admin dashboard is operational tooling and must not hold private keys.
- Referral/XP is offchain and non-financial.
- Deployment environment variables are sensitive operational configuration.

## Primary Threats

### T-001 Buyer Overclaim

Risk: buyer receives more SKIP than purchased.

Mitigations:

- `claimable()` subtracts `claimed[user]`.
- `claim()` updates state before transfer.
- `nonReentrant` on claim.
- Tests cover immediate, partial, full and over-claimed edge cases.

### T-002 Hardcap or Stage Cap Bypass

Risk: contract accepts more USDC or sells more SKIP than intended.

Mitigations:

- hardcap checks before accounting.
- `_quote()` caps tokens per stage.
- tests cover exact stage fills, cross-stage buys and near-hardcap dust.

### T-003 Refund Underfunding

Risk: unsuccessful sale cannot refund users due to development withdrawals.

Mitigations:

- refund mode only enables when contract USDC balance is at least `totalRaised`.
- `repayDevelopmentFunds()` can restore liquidity.
- tests cover partial and full repayment behavior.

### T-004 Owner Misuse or Key Compromise

Risk: owner pauses, finalizes or withdraws funds unexpectedly.

Mitigations:

- owner-only gates are explicit and tested.
- events emit sensitive actions.
- mainnet requires multisig ownership and operational policy.

### T-005 Mock Token Misconfiguration

Risk: mock USDC is accidentally used for real mainnet payment.

Mitigations:

- Amoy deploy scripts split mock and USDC modes.
- default `deploy:amoy` aborts without explicit mode.
- mainnet checklist must reject mock token addresses.

### T-006 Admin/API Abuse

Risk: admin brute-force, CSV scraping, referral data exfiltration.

Mitigations:

- Admin V1 uses server-side password and HttpOnly session cookie.
- Admin API checks session.
- production still needs rate limiting and audit logs.

### T-007 Misleading User Communication

Risk: users misunderstand XP, rewards, airdrops, listing or profit expectations.

Mitigations:

- docs and UI avoid guarantees.
- Referral/XP docs state reputation-only.
- legal review remains mandatory before public sale materials.

## Residual Risks

- No external audit yet.
- No timelock yet.
- Admin Auth V1 is not final production auth.
- Event analytics are offchain reconstructions and may be incomplete under RPC failure.
- Legal eligibility decisions are unresolved.

