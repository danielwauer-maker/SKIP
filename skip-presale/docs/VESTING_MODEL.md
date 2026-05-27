# Vesting Model

Last updated: 2026-05-25

## Buyer Vesting

Buyer vesting is implemented inside `SkipPresale`.

Current parameters:

- Immediate unlock: `IMMEDIATE_CLAIM_BPS = 2,000` basis points, or 20%.
- Linear vesting amount: remaining 80%.
- Linear duration: `BUYER_VESTING_DURATION = 180 days`.
- Vesting start: `vestingStart`, set when successful `finalize()` enables claims.

## Claimable Formula

For each buyer:

```text
immediate = purchased[user] * IMMEDIATE_CLAIM_BPS / 10,000
linearVestingAmount = purchased[user] - immediate
elapsed = max(block.timestamp - vestingStart, 0)
vestedLinear =
  if elapsed >= BUYER_VESTING_DURATION:
    linearVestingAmount
  else:
    linearVestingAmount * elapsed / BUYER_VESTING_DURATION
unlocked = immediate + vestedLinear
claimable = max(unlocked - claimed[user], 0)
```

## Expected Unlock Schedule

| Time from `vestingStart` | Total Unlocked |
| --- | ---: |
| 0 days | 20% |
| 45 days | 40% |
| 90 days | 60% |
| 180 days | 100% |
| After 180 days | 100% |

Integer division floors intermediate values. At or after full duration the contract returns the full remaining linear amount, so there is no permanent rounding loss.

## Claim Behavior

- Claims are disabled before successful finalize.
- Claims are disabled in refund mode.
- Buyers may claim multiple times.
- Each claim increases `claimed[user]` and `totalClaimed`.
- Buyers cannot overclaim because `claimable()` subtracts prior claimed amount.

## Unsold Token Withdrawal Interaction

After finalize, the owner may withdraw only tokens beyond:

```text
requiredForClaims = totalSold - totalClaimed
```

This preserves future buyer claims even if some buyers have only partially claimed.

## Team Vesting

Team vesting is separate in `SkipTeamVesting`.

- Cliff: 365 days.
- Linear release after cliff: 730 days.
- Releases deposited tokens only.
- No minting exists in the vesting contract.

