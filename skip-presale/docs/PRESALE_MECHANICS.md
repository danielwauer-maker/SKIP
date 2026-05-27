# Presale Mechanics

Last updated: 2026-05-25

## Overview

`SkipPresale` sells a fixed SKIP allocation across 12 deterministic stages. Buyers pay USDC. The contract tracks contributed USDC, purchased SKIP, total raised and total sold. It supports successful finalization with buyer vesting or unsuccessful finalization with refunds.

## Fixed Parameters

- Softcap: `250,000 USDC`
- Hardcap: `3,720,000 USDC`
- Stage count: `12`
- Stage token cap: `20,000,000,000 SKIP` per stage
- Total presale allocation: `240,000,000,000 SKIP`
- Development unlock: `25%` of USDC attributed to fully completed stages
- Buyer vesting: 20% immediate, 80% linear over 180 days

## Stage Prices

Prices are expressed in 6-decimal USDC base units per 1 SKIP with 18 decimals:

| Stage | Price USDC | Stage Raise |
| --- | ---: | ---: |
| 1 | 0.000004 | 80,000 USDC |
| 2 | 0.000005 | 100,000 USDC |
| 3 | 0.000006 | 120,000 USDC |
| 4 | 0.000008 | 160,000 USDC |
| 5 | 0.000009 | 180,000 USDC |
| 6 | 0.000011 | 220,000 USDC |
| 7 | 0.000013 | 260,000 USDC |
| 8 | 0.000016 | 320,000 USDC |
| 9 | 0.000020 | 400,000 USDC |
| 10 | 0.000025 | 500,000 USDC |
| 11 | 0.000031 | 620,000 USDC |
| 12 | 0.000038 | 760,000 USDC |

The sum of all stage raises equals the hardcap.

## Buy Flow

1. Buyer approves USDC.
2. Buyer calls `buy(usdcAmount)`.
3. Contract verifies sale timing, pause state and hardcap.
4. `_quote()` walks remaining stages and calculates purchasable SKIP.
5. Contract transfers only `usdcUsed`, not necessarily the full requested amount if tiny dust remains.
6. Contract updates buyer and aggregate accounting.
7. Contract emits `TokensPurchased`.

## Dust Handling

USDC has 6 decimals and SKIP has 18 decimals. Some stage prices do not divide evenly into token units. `_quote()` floors token and USDC calculations and allows up to `MAX_PRICE_DUST_USDC = 38` base units of unspent USDC dust. This avoids reverting legitimate purchases while preventing over-allocation.

## Finalization

`finalize()` is owner-only.

It is allowed when:

- `block.timestamp > endTime`, or
- hardcap is reached, or
- all stages are sold out.

If `totalRaised >= SOFT_CAP`, claims are enabled and `vestingStart` is set.

If softcap is not reached, refunds are enabled only when the contract holds enough USDC to refund all contributions. If development funds were withdrawn, the owner or treasury must repay them first.

## Treasury Flow

Development withdrawals are owner-only and limited to 25% of USDC attributed to fully completed stages. Partially sold stages do not unlock development funds.

Successful finalization allows remaining USDC to be withdrawn by the owner.

## User Protections

- Hardcap and stage caps are enforced.
- `SafeERC20` is used for token transfers.
- `nonReentrant` protects buy, claim, refund and withdrawal functions.
- Refund mode requires enough USDC liquidity.
- Unsold token withdrawal preserves all unclaimed buyer allocations.

