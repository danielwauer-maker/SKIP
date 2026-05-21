# $SKIP Presale MVP

$SKIP is an experimental community token for people who are done wasting life in queues, traffic, waiting rooms and broken systems.

Risk notice: $SKIP is a high-risk crypto asset. You may lose your entire contribution. No profit, return, exchange listing or future utility is guaranteed.

## Stack

- Monorepo: pnpm workspaces
- Web: Next.js App Router, TypeScript, Tailwind CSS, RainbowKit, wagmi, viem
- Contracts: Hardhat, Solidity 0.8.24, OpenZeppelin
- First chain: Polygon Amoy testnet
- Payment token: USDC, with MockUSDC for local and test deployments

## Installation

```bash
cd skip-presale
pnpm install
```

## Environment Setup

```bash
cp packages/contracts/.env.example packages/contracts/.env
cp apps/web/.env.example apps/web/.env.local
```

Set `PRIVATE_KEY`, `POLYGON_AMOY_RPC_URL`, `POLYGONSCAN_API_KEY`, and optionally `USDC_ADDRESS`.
For the web app, set deployed contract addresses and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.

## Contracts Compile

```bash
pnpm --filter @skip/contracts compile
```

## Tests

```bash
pnpm --filter @skip/contracts test
```

## Local Deployment

Terminal 1:

```bash
cd skip-presale
pnpm --filter @skip/contracts hardhat node
```

Terminal 2:

```bash
cd skip-presale
pnpm --filter @skip/contracts deploy:local
```

Copy the output addresses into `apps/web/.env.local`.

## Amoy Deployment

```bash
cd skip-presale
pnpm --filter @skip/contracts deploy:amoy
```

If `USDC_ADDRESS` is empty, the script deploys `MockUSDC`. For a production-like Amoy run, set the correct test USDC address after verification.

## ABI Export

```bash
pnpm --filter @skip/contracts export:abi
```

ABIs are exported to `apps/web/abi`.

## Frontend Start

```bash
cd skip-presale
pnpm dev:web
```

Open `http://localhost:3000`.

## Test Purchase Flow

1. Deploy local contracts and copy addresses into `apps/web/.env.local`.
2. Mint MockUSDC to a local wallet if needed.
3. Connect wallet in the frontend.
4. Approve USDC.
5. Buy $SKIP.
6. Check `/dashboard` for contribution and purchased tokens.

## Claim Test

1. Reach the softcap in local tests or use Hardhat tests.
2. Increase time past `endTime` or reach hardcap.
3. Call `finalize()`.
4. Open `/dashboard` and claim.

## Refund Test

1. Keep total raised below softcap.
2. Move time past `endTime`.
3. Call `finalize()`.
4. If development funds were withdrawn, call `repayDevelopmentFunds()` until the contract can refund all contributions.
5. Open `/dashboard` and refund.

## Mainnet Checklist

- Complete independent smart contract review.
- Complete legal review of sale terms, copy and user eligibility.
- Verify token, presale and USDC addresses.
- Verify contract source on Polygonscan.
- Confirm token allocation wallet controls and multisig ownership.
- Confirm no unsafe admin powers are introduced.
- Confirm public docs match deployed bytecode and parameters.
- Confirm frontend risk warnings on every route.
- Confirm WalletConnect project ID, RPC quality and monitoring.

## Security Checklist

- Fixed SKIP supply and no public minting.
- SafeERC20 used for token transfers.
- ReentrancyGuard used on payment, claim, refund and withdrawal flows.
- Pausable emergency control exists for purchases.
- Hardcap enforced before accepting USDC.
- Softcap refund path requires enough USDC in contract.
- Development treasury is capped at 25% of raised funds.
- Development funds can be repaid before refund activation.
- Owner cannot edit user contributions or purchased balances.
- Unsold token withdrawal preserves unclaimed balances after successful finalize.

## Legal Review Checklist

See `docs/legal-review-checklist.md`. Do not publish public sale materials before review.
