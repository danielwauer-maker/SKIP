# Refund Model

Last updated: 2026-05-25

## Purpose

Refunds protect buyers if the presale does not reach the softcap. Refunds are available only after unsuccessful finalization and only when the contract has enough USDC liquidity to repay all recorded contributions.

## Conditions

Refund mode can be enabled when:

- `finalized == true`,
- `totalRaised < SOFT_CAP`,
- contract USDC balance is at least `totalRaised`.

If those conditions are met during `finalize()`, `refundEnabled` is set to true.

If development funds were withdrawn and the contract cannot refund all contributions, `finalize()` emits unsuccessful finalization without enabling refunds. `repayDevelopmentFunds()` can then restore liquidity. Once enough USDC is back in the contract, refund mode is enabled.

## Refund Flow

1. User calls `refund()`.
2. Contract checks `refundEnabled`.
3. Contract checks user has not already refunded.
4. Contract reads `contributed[user]`.
5. Contract sets:
   - `hasRefunded[user] = true`
   - `contributed[user] = 0`
   - `purchased[user] = 0`
6. Contract transfers USDC back to user.
7. Contract emits `Refunded`.

## Development Funds and Repayment

The owner can withdraw development funds only from fully completed stages and only up to `DEVELOPMENT_BPS = 2,500`, or 25%.

If softcap is not reached, withdrawn development funds may need to be repaid before users can refund. Partial repayment does not enable refunds until liquidity is fully restored.

## Important Limitations

- Refunds are not available after successful finalize.
- Claims are not available in refund mode.
- Refund activation depends on USDC liquidity being present.
- Operational runbooks must ensure any withdrawn development funds can be repaid if softcap fails.

## Tested Scenarios

- Refunds disabled before finalize.
- Refunds enabled after unsuccessful finalize with intact liquidity.
- Refunds remain disabled if withdrawn development funds are missing.
- Partial repayment does not enable refunds.
- Full repayment enables refunds.
- Double refunds are blocked.

