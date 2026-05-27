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

### Landing Page Community Links

The root landing page uses public environment variables for its community CTAs:

```bash
NEXT_PUBLIC_DISCORD_URL="https://discord.gg/your-invite"
NEXT_PUBLIC_X_URL="https://x.com/your-handle"
```

The homepage waitlist posts to `apps/web/app/api/waitlist/route.ts`. It validates email addresses and returns a success
response for the current early-access flow. Before production launch, connect that route to a database, CRM, or email
platform so waitlist submissions are persisted.

## Presale Mechanics

- Hardcap: 3,720,000 USDC, equal to the exact sum of all 12 stage raises.
- Development treasury withdrawals are stage-based: only 25% of USDC attributed to fully completed stages can be withdrawn during the presale.
- Partially sold stages do not unlock development funds.
- Buyer vesting is contract-driven through `IMMEDIATE_CLAIM_BPS` and `BUYER_VESTING_DURATION`, with UI displays reading those values from the deployed presale contract.
- Team vesting uses `SkipTeamVesting.sol` with a 12 month cliff and 24 months of linear vesting.
- Staking is not part of Phase 1.

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
Set `TEAM_VESTING_AMOUNT` before deployment if the script should transfer team tokens into `SkipTeamVesting`.

## Mint Local MockUSDC

After local deployment, mint MockUSDC to a wallet on the localhost Hardhat network:

```bash
cd skip-presale
MOCK_USDC_ADDRESS=0x... RECIPIENT_ADDRESS=0x... AMOUNT_USDC=100000 pnpm --filter @skip/contracts mint:usdc
```

PowerShell example:

```powershell
$env:MOCK_USDC_ADDRESS="0x..."
$env:RECIPIENT_ADDRESS="0x..."
$env:AMOUNT_USDC="100000"
pnpm --filter @skip/contracts mint:usdc
```

CLI arguments are also supported:

```bash
pnpm --filter @skip/contracts mint:usdc -- --mock-usdc-address 0x... --recipient-address 0x... --amount-usdc 100000
```

The default mint amount is `100000` USDC with 6 decimals.

## Local End-to-End Presale Test

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

Copy `usdc` and `skipPresale` from the deployment output.

PowerShell setup:

```powershell
$env:MOCK_USDC_ADDRESS="0x..."
$env:SKIP_PRESALE_ADDRESS="0x..."
$env:RECIPIENT_ADDRESS="0x..."
$env:AMOUNT_USDC="5000000"
$env:MODE="softcap"
```

Fund your browser wallet with local ETH and MockUSDC:

```bash
pnpm --filter @skip/contracts faucet:dev
```

Simulate presale buys:

```bash
pnpm --filter @skip/contracts simulate:presale
```

Supported modes:

```powershell
$env:MODE="softcap"
pnpm --filter @skip/contracts simulate:presale

$env:MODE="hardcap"
pnpm --filter @skip/contracts simulate:presale

$env:MODE="sellout"
pnpm --filter @skip/contracts simulate:presale
```

Finalize locally. If finalize is only blocked by `endTime` and the softcap is reached, the script advances local EVM time and mines a block.

```bash
pnpm --filter @skip/contracts finalize:local
```

Start the web app and test Dashboard/Claim:

```bash
pnpm dev:web
```

Reset note: restarting the Hardhat node clears local chain state. After a restart, run `deploy:local` again and update `apps/web/.env.local` with the fresh addresses.

## Amoy Deployment

The default command is intentionally safe and aborts. Choose one explicit mode:

```bash
cd skip-presale
pnpm --filter @skip/contracts deploy:amoy
```

### Public Testnet Simulation with MockUSDC

Use this only for public testnet simulations where users understand the payment token is a mock token:

```bash
cd skip-presale
pnpm --filter @skip/contracts deploy:amoy:mock
```

The deployment output clearly prints:

```text
USING MOCK USDC - NOT REAL PRESALE PAYMENT TOKEN
```

### Public Testnet with Existing Testnet USDC

Use this when you have a verified testnet USDC address:

```powershell
cd skip-presale
$env:USDC_ADDRESS="0x..."
pnpm --filter @skip/contracts deploy:amoy:usdc
```

`deploy:amoy:usdc` fails hard if `USDC_ADDRESS` is missing or zero. Mainnet must never use MockUSDC.

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

## Referral + XP System

The web app includes a lightweight Referral + XP + OG Founder system for testnet community growth. It is a reputation system only: XP, Founder status and OG roles do not guarantee token rewards, airdrops, profits or allocations.

### Referral Setup

The referral backend runs inside Next.js App Router route handlers and uses Prisma ORM. Local development defaults to SQLite; PostgreSQL can be introduced later by changing `DATABASE_URL` and the Prisma datasource provider.

Add these values to `apps/web/.env.local`:

```bash
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_ENABLE_REFERRALS=true
ADMIN_PASSWORD="change-me"
ADMIN_SESSION_SECRET="generate-a-long-random-secret"
REFERRAL_ADMIN_SECRET=
REFERRAL_RATE_LIMIT_ENABLED=false
```

Install/generate/migrate:

```bash
pnpm --filter @skip/web db:generate
pnpm --filter @skip/web db:migrate
```

Useful database commands:

```bash
pnpm --filter @skip/web db:studio
pnpm --filter @skip/web db:reset
```

For a local PostgreSQL rehearsal:

```bash
docker compose -f docker-compose.postgres.yml up -d
```

Use:

```bash
DATABASE_URL="postgresql://skip:skip_dev_password@localhost:5432/skip?schema=public"
```

The default Prisma schema is SQLite for local development. A PostgreSQL-ready schema variant is available at `apps/web/prisma/schema.postgres.prisma`; keep model changes mirrored until the project fully switches providers.

### Admin Auth

Admin V1 uses a server-side password login:

- `/admin` redirects to `/admin/login` without a valid session.
- `ADMIN_PASSWORD` is checked server-side.
- `ADMIN_SESSION_SECRET` signs an HttpOnly session cookie.
- Session duration is 8 hours.
- The cookie is `SameSite=Lax` and `secure` in production.
- Admin APIs use the same session, with legacy `REFERRAL_ADMIN_SECRET` still accepted as a fallback for scripted access.

### Local Referral Test Flow

1. Start the web app with `pnpm dev:web`.
2. Open `/referrals`.
3. Connect a wallet and register it.
4. Copy the generated referral URL.
5. Open the referral URL with another wallet and register.
6. Use the quest actions to test daily check-in, feedback and testnet buy verification.
7. Open `/admin`, enable admin locally with `NEXT_PUBLIC_ENABLE_ADMIN=true`, then inspect the Growth tab.

### Anti-Abuse Notes

- Wallet addresses are normalized lowercase and unique.
- Self-referrals are blocked.
- Referral attribution is set only once.
- XP actions use dedupe keys.
- Daily connect XP is limited to once per UTC day.
- Referral click IP and user-agent data are hashed server-side; cleartext IPs are not stored.
- Suspicious referral patterns are surfaced in admin analytics. V1 does not automatically ban wallets.

### Mainnet Notes

- Configure `REFERRAL_ADMIN_SECRET` before exposing admin analytics outside local development.
- Add real authentication around `/admin`; the current admin page guard is frontend-only.
- Keep public copy focused on XP, Founder status, OG roles, ecosystem reputation and potential future eligibility.
- Do not describe XP as guaranteed rewards, guaranteed airdrops, guaranteed profits or guaranteed allocations.

More details: `docs/referral-xp-system.md`.

## Test Purchase Flow

1. Deploy local contracts and copy addresses into `apps/web/.env.local`.
2. Mint MockUSDC to a local wallet with `pnpm --filter @skip/contracts mint:usdc`.
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
- Confirm stage-based development treasury numbers against finalized stage pricing.
- Confirm hardcap remains equal to the exact 12-stage raise of 3,720,000 USDC.
- Confirm buyer vesting UX and claim schedule on testnet.
- Confirm team vesting beneficiary, start timestamp and deposited team allocation.
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
- Development treasury is capped at 25% of funds from fully completed stages.
- Development funds can be repaid before refund activation.
- Owner cannot edit user contributions or purchased balances.
- Unsold token withdrawal preserves unclaimed balances after successful finalize.
- Buyer vesting prevents 100% immediate presale claim.
- Team vesting uses deposited tokens only and does not mint.

## Phase 2 Staking

Staking is intentionally not part of Phase 1. A future `SkipStaking.sol` should be built as a separate module, not inside the presale contract, with an explicit reward source, clear accounting, `nonReentrant` protections and no reward guarantees in public copy.

## Legal Review Checklist

See `docs/legal-review-checklist.md`. Do not publish public sale materials before review.
