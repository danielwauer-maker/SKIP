# Public Testnet Runbook

## Goal

Run a controlled public Amoy testnet phase for the SKIP presale UX, dashboard, admin analytics and Referral/XP reputation system. This phase is for testing only. It does not use real funds and does not promise token rewards, airdrops, profit or allocations.

## Testnet vs Mainnet

- Testnet uses Amoy and can use MockUSDC for simulations.
- Mainnet must use the real payment token address and must not use MockUSDC.
- Testnet XP and Founder status are community reputation signals only.

## Setup Amoy

1. Create or confirm `POLYGON_AMOY_RPC_URL`.
2. Create WalletConnect/Reown Project ID.
3. Add deployed website origins to Reown Allowed Origins.
4. Set `NEXT_PUBLIC_CHAIN_ID=80002`.

## Deploy With MockUSDC

Use this mode for public testnet simulations:

```powershell
pnpm --filter @skip/contracts deploy:amoy:mock
```

The deployment output must include:

```text
USING MOCK USDC - NOT REAL PRESALE PAYMENT TOKEN
```

## Deploy With Existing Testnet USDC

Use only after verifying the token address and decimals:

```powershell
$env:USDC_ADDRESS="0x..."
pnpm --filter @skip/contracts deploy:amoy:usdc
```

## Web Environment

```env
NEXT_PUBLIC_CHAIN_ID=80002
NEXT_PUBLIC_SKIP_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_SKIP_PRESALE_ADDRESS=0x...
NEXT_PUBLIC_SKIP_TEAM_VESTING_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_APP_URL=https://...
NEXT_PUBLIC_ENABLE_REFERRALS=true
NEXT_PUBLIC_ENABLE_ADMIN=true
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/skip?schema=public
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...
```

## Admin Auth

- `/admin` redirects to `/admin/login` without a valid session.
- Login sets an HttpOnly cookie for 8 hours.
- Admin APIs require the same session.
- Real identity/auth can replace this V1 guard before Mainnet.

## Referral/XP

- Enable referrals with `NEXT_PUBLIC_ENABLE_REFERRALS=true`.
- Explain XP as reputation only.
- Do not promise token rewards, airdrops, profits or allocations.

## Tester Onboarding

1. Add Amoy to wallet.
2. Connect wallet on `/presale`.
3. Request MockUSDC if using mock mode.
4. Approve and buy test tokens.
5. Open `/dashboard` to inspect claim/refund state.
6. Open `/referrals` to register and share referral link.
7. Submit bugs with wallet, transaction hash, browser and steps.

## Testnet Missions

- Complete a small buy.
- Complete a stage-boundary buy.
- Register referral profile.
- Invite one tester.
- Verify dashboard values.
- Try admin event load.

## Bug Report Process

Collect:
- wallet address
- tx hash
- chain ID
- browser/device
- exact steps
- screenshot or console error
- expected vs actual result

## Go/No-Go Before Mainnet

Go only when:
- contract audit complete
- owner controls moved to multisig or timelock
- real admin auth strategy approved
- PostgreSQL production DB tested
- monitoring and alerting active
- legal and eligibility review complete
- no MockUSDC paths in Mainnet config
