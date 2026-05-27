# Project Status

Last updated: 2026-05-25

## Summary

`skip-presale` is a functional local MVP and a strong public-testnet candidate. The core presale mechanics are implemented, the frontend reads the most important presale state from contracts, and the Referral/XP system is intentionally offchain and non-financial. Mainnet readiness is not yet achieved because the project still needs independent audit, multisig ownership, production database operations, monitoring, and legal/compliance review.

## Current Readiness

| Area | Status | Readiness |
| --- | --- | ---: |
| Local MVP | Functional | 98% |
| Public Testnet | Near ready after dry-run | 94% |
| Mainnet | Not ready | 58% |

## Implemented

- Fixed-supply `SkipToken` with no public minting after deployment.
- `SkipPresale` with 12 fixed stages, hardcap equal to total stage raise, dust-aware quote logic, pause support, successful finalize/claim path and softcap refund path.
- Buyer vesting updated to 20% immediate and 80% linear over 180 days.
- `SkipTeamVesting` with 12 month cliff and 24 month linear vesting.
- Local Hardhat, Polygon Amoy mock mode and Polygon Amoy USDC-address mode.
- Next.js presale page, dashboard, admin analytics and referral dashboard.
- Admin V1 password session with HttpOnly cookie.
- Referral/XP/OG system using Prisma and offchain reputation only.
- SQLite local database and PostgreSQL schema preparation.
- Public testnet runbook and manual test checklist.

## Verified Recently

- Contract compile completed.
- Contract test suite passes with 35 tests.
- Web lint, typecheck and production build pass.
- ABI export completed after buyer vesting parameter change.

## Important Product Constraints

- No staking in V1.
- No token rewards for referrals in V1.
- No guaranteed airdrops, profits, listings, returns, allocations or future utility.
- XP and Founder/OG status remain community reputation signals only.
- No mainnet deployment without explicit human approval.

## Mainnet Readiness Position

The codebase is trending well, but mainnet must remain blocked until:

- external Solidity audit is complete and findings are addressed,
- owner and treasury controls are moved to a multisig, ideally with a timelock for sensitive operations,
- production PostgreSQL, backup, restore and monitoring are operational,
- admin authentication is hardened beyond password-only V1,
- legal review confirms sale language, eligibility, jurisdictional restrictions and risk disclosures.

