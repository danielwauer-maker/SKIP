# Auditor README

Last updated: 2026-05-25

## Project

`skip-presale` is a monorepo containing Solidity presale contracts and a Next.js frontend/admin app for the `$SKIP` presale MVP.

## Repository Layout

```text
packages/contracts/contracts   Solidity contracts
packages/contracts/test        Hardhat tests
packages/contracts/scripts     Deployment and local simulation scripts
apps/web                       Next.js frontend and route-handler backend
apps/web/prisma                Referral/XP database schema
docs                           Project, risk and audit documentation
```

## Contract Summary

- `SkipToken`: fixed supply ERC20. No public mint function.
- `SkipPresale`: staged USDC presale, buyer vesting, refund path, development treasury unlocks.
- `SkipTeamVesting`: deposited-token team vesting with cliff and linear release.
- `MockUSDC`: local/testnet 6-decimal mock token with owner minting.

## Current Buyer Vesting

- 20% immediate after successful finalize.
- 80% linear over 180 days from `vestingStart`.

## Commands

Install:

```bash
pnpm install
```

Compile:

```bash
pnpm --filter @skip/contracts compile
```

Test:

```bash
pnpm --filter @skip/contracts test
```

Export ABI:

```bash
pnpm --filter @skip/contracts export:abi
```

Web checks:

```bash
pnpm --filter @skip/web lint
pnpm --filter @skip/web typecheck
pnpm --filter @skip/web build
```

## Important Docs

- `docs/AUDIT_SCOPE.md`
- `docs/PRESALE_MECHANICS.md`
- `docs/VESTING_MODEL.md`
- `docs/REFUND_MODEL.md`
- `docs/THREAT_MODEL.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/MAINNET_BLOCKERS.md`
- `docs/DEPLOYMENT_ASSUMPTIONS.md`

## Security Focus Areas

Please prioritize:

- hardcap and stage cap correctness,
- dust and rounding behavior,
- buyer claim/vesting accounting,
- refund liquidity and repayment behavior,
- development treasury withdrawal limits,
- owner privilege boundaries,
- unsold token withdrawal safety,
- deployment misconfiguration risks.

## Known Mainnet Blockers

- No external audit completed yet.
- Ownership not yet transferred to multisig.
- No timelock.
- Production database backup/restore not rehearsed.
- Admin Auth V1 needs rate limiting and audit logs.
- Legal/compliance review remains pending.

## Communication Constraints

Public copy must not promise profits, returns, exchange listings, token rewards, airdrops or allocations. Referral/XP is offchain community reputation only.

