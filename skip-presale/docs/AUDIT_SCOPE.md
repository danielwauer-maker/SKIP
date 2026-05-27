# Audit Scope

Last updated: 2026-05-25

## Objective

Review the `$SKIP` presale system for correctness, safety and operational risks before any mainnet deployment. The audit should focus on funds safety, claim/refund correctness, owner privileges, rounding behavior and deployment assumptions.

## In Scope

### Contracts

- `packages/contracts/contracts/SkipToken.sol`
- `packages/contracts/contracts/SkipPresale.sol`
- `packages/contracts/contracts/SkipTeamVesting.sol`
- `packages/contracts/contracts/MockUSDC.sol`

### Tests

- `packages/contracts/test/SkipToken.test.ts`
- `packages/contracts/test/SkipPresale.test.ts`
- `packages/contracts/test/SkipTeamVesting.test.ts`
- `packages/contracts/test/MockUSDC.test.ts`

### Deployment Scripts

- `packages/contracts/scripts/deploy-local.ts`
- `packages/contracts/scripts/deploy-amoy.ts`
- `packages/contracts/scripts/deploy-amoy-mock.ts`
- `packages/contracts/scripts/deploy-amoy-usdc.ts`
- local simulation and finalization scripts under `packages/contracts/scripts`.

## Out of Scope

- Mainnet deployment execution.
- Legal/compliance review.
- Token price, market value, liquidity, listing or future utility analysis.
- Offchain Referral/XP system financial valuation. Referral/XP is non-financial community reputation only.
- Future staking or token reward systems. These are intentionally not part of V1.

## Security Questions

Auditors should specifically review:

- Can hardcap or stage token caps be exceeded?
- Can buyers overclaim SKIP?
- Can refunds be blocked or underfunded in unexpected states?
- Are development withdrawals correctly capped by completed stages?
- Can owner actions drain funds earlier than intended?
- Is dust handling safe across all stage prices?
- Is finalization behavior correct around `endTime`, hardcap and sold-out states?
- Does unsold token withdrawal preserve all future buyer claims?
- Does team vesting release only deposited tokens?
- Are all privileged actions clearly owner-gated?

## Current Mainnet Position

Mainnet remains blocked until external audit is complete, findings are resolved, ownership is transferred to a multisig and legal/compliance review is complete.

