# Deployment Assumptions

Last updated: 2026-05-25

## Environments

### Local

- Chain: Hardhat localhost, chain ID `31337`.
- Payment token: `MockUSDC`.
- Database: SQLite by default.
- Purpose: development, local E2E, contract simulation.

### Public Testnet

- Chain: Polygon Amoy, chain ID `80002`.
- Payment token options:
  - `deploy:amoy:mock` for MockUSDC simulation only.
  - `deploy:amoy:usdc` for a provided testnet USDC address.
- Public copy must clearly state testnet has no real funds and MockUSDC is not a real payment token.

### Mainnet

- Chain: Polygon, chain ID `137`.
- Payment token must be verified production USDC.
- MockUSDC must never be used.
- Mainnet deployment requires explicit human approval.

## Contract Deployment Assumptions

- `SkipToken` is deployed first and mints fixed supply to initial owner.
- `SkipPresale` is deployed with SKIP token address, USDC address, start time, end time and initial owner.
- Presale allocation of `240,000,000,000 SKIP` is transferred into `SkipPresale`.
- `SkipTeamVesting` is deployed separately with token, beneficiary, start time and owner.
- Optional team vesting amount is transferred after deployment.
- ABIs are exported to `apps/web/abi` after compile/deploy scripts.

## Required Environment Variables

Contracts:

- `PRIVATE_KEY` for testnet/mainnet deployment only.
- `POLYGON_AMOY_RPC_URL` for Amoy.
- `POLYGON_RPC_URL` for Polygon mainnet.
- `POLYGONSCAN_API_KEY` for verification.
- `USDC_ADDRESS` for `deploy:amoy:usdc` and any production-like run.
- `PRESALE_START`, optional.
- `PRESALE_END`, optional.
- `TEAM_BENEFICIARY`, recommended.
- `TEAM_VESTING_AMOUNT`, optional.

Web:

- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_SKIP_TOKEN_ADDRESS`
- `NEXT_PUBLIC_SKIP_PRESALE_ADDRESS`
- `NEXT_PUBLIC_SKIP_TEAM_VESTING_ADDRESS`
- `NEXT_PUBLIC_USDC_ADDRESS`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_ENABLE_REFERRALS`
- `NEXT_PUBLIC_ENABLE_ADMIN`

## Mainnet Pre-Deployment Assumptions

- External audit completed.
- Critical/high audit findings resolved.
- Legal review completed.
- Multisig address chosen and verified.
- Treasury destination documented.
- Production PostgreSQL configured with backup/restore process.
- Monitoring and incident response are ready.
- Public docs match deployed bytecode and constructor parameters.

## Abort Conditions

Abort deployment if:

- any mainnet address is zero,
- payment token is MockUSDC on mainnet,
- chain ID does not match intended network,
- deployer is not the approved deployment wallet,
- multisig ownership transfer cannot be completed,
- ABI/export artifacts do not match compiled contracts,
- legal approval or human mainnet approval is missing.

