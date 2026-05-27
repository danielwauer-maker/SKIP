# Tokenomics

Total supply: 1,000,000,000,000 SKIP.

Distribution:

- Presale: 25%
- Community Rewards: 30%
- Liquidity: 15%
- Marketing: 10%
- Ecosystem/App Development: 10%
- Team Vesting: 7%
- Reserve: 3%

Presale allocation used by the current contract: 240,000,000,000 SKIP across 12 stages of 20,000,000,000 SKIP each.
The exact sum of all 12 stage raises is 3,720,000 USDC, and the presale hardcap is set to the same value.
Keep the remaining presale allocation strategy documented before mainnet deployment.

## Vesting

Presale buyer vesting is contract-driven. The immediate unlock comes from `IMMEDIATE_CLAIM_BPS`, and the linear vesting period comes from `BUYER_VESTING_DURATION` on the deployed presale contract.

Team allocation should be deposited into `SkipTeamVesting.sol`. The contract uses a 12 month cliff followed by 24 months of linear vesting. It releases already deposited tokens only and has no minting capability.

## Development Treasury

Development withdrawals are stage-based. The owner can withdraw at most 25% of USDC attributed to fully completed presale stages. Partially sold stages do not increase the development unlock.
