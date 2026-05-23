# Manual Test Checklist

## 1. Local Setup

- [ ] Goal: Start a clean local chain. Steps: Start Hardhat node, run `pnpm --filter @skip/contracts deploy:local`, copy addresses into `apps/web/.env.local`. Expected: Web app shows configured contracts and no missing-address warning.
- [ ] Goal: Fund browser wallet. Steps: Set `MOCK_USDC_ADDRESS`, `RECIPIENT_ADDRESS`, `AMOUNT_USDC`; run `pnpm --filter @skip/contracts faucet:dev`. Expected: Recipient has local ETH and MockUSDC.

## 2. Presale Buy Flow

- [ ] Goal: Approve and buy. Steps: Open `/presale`, connect wallet, enter USDC amount, approve, buy. Expected: Approval succeeds, buy succeeds, raised/sold/balance refresh.
- [ ] Goal: Wrong chain protection. Steps: Switch wallet away from target chain. Expected: Buy/approve are disabled and switch-chain action is visible.

## 3. Stage Flow

- [ ] Goal: Stage sellout. Steps: Use `simulate:presale` or manual buys to complete stage 1. Expected: Stage 2 price activates and stage 1 sold equals cap.
- [ ] Goal: Cross-stage buy. Steps: Buy an amount larger than current stage remaining. Expected: Transaction succeeds, UI warns about stage boundary, next stage sold amount updates.

## 4. Large Buy / Gas Risk

- [ ] Goal: Large amount warning. Steps: Enter 250,000+ USDC or amount crossing current stage. Expected: UI recommends smaller stage-sized blocks.

## 5. Dashboard

- [ ] Goal: User position. Steps: Open `/dashboard` after buy. Expected: Contributed, purchased, claimable/refundable and status are accurate.
- [ ] Goal: Event duplication. Steps: Buy twice and watch observed transaction history. Expected: Each tx appears once.

## 6. Admin Analytics

- [ ] Goal: Load presale events. Steps: Enable admin locally, open `/admin`, click Load events. Expected: Stage, buyer, treasury, vesting and risk panels populate without duplicate logs.
- [ ] Goal: CSV export. Steps: Open Growth tab, enter Admin API Secret if configured, export CSVs. Expected: Users/referrals/xp CSV files download.

## 7. Referral + XP

- [ ] Goal: Register wallet. Steps: Open `/referrals`, connect wallet, register. Expected: Referral code, link and 100 XP appear.
- [ ] Goal: Referral attribution. Steps: Open referral URL in another browser/session, register another wallet. Expected: Referrer stats increment and only one click is converted.
- [ ] Goal: Self-referral block. Steps: Try registering through your own code with same wallet. Expected: API rejects self-referral.
- [ ] Goal: XP dedupe. Steps: Claim daily check-in twice. Expected: XP is awarded once per UTC day.

## 8. Treasury

- [ ] Goal: Development unlock. Steps: Complete a stage and inspect treasury panel. Expected: Max development withdrawable equals 25% of completed stage raise.

## 9. Refund

- [ ] Goal: Failed presale refund. Steps: Keep under softcap, advance time, finalize. Expected: Refund enabled if USDC liquidity covers totalRaised.
- [ ] Goal: Repayment path. Steps: Withdraw dev funds, fail softcap, finalize, repay development funds. Expected: Refund is disabled until repayment restores coverage.

## 10. Buyer Vesting

- [ ] Goal: Successful finalize claim. Steps: Reach softcap, finalize, open dashboard. Expected: 50% claimable immediately.
- [ ] Goal: Linear vesting. Steps: Advance 45 and 90 days locally. Expected: 75% then 100% total purchased becomes claimable/claimed.

## 11. Team Vesting

- [ ] Goal: Cliff protection. Steps: Try release before 12 months. Expected: Release reverts with nothing to release.
- [ ] Goal: Linear team release. Steps: Advance after cliff. Expected: Releasable increases linearly over 24 months.

## 12. Public Testnet Preflight

- [ ] Goal: Env sanity. Steps: Set Amoy chain, contract addresses, WalletConnect project ID, app URL. Expected: No public-testnet env warnings except intentional admin warning.
- [ ] Goal: MockUSDC clarity. Steps: Deploy with `deploy:amoy:mock`. Expected: Output clearly says MockUSDC is not a real payment token.

## 13. Mainnet Preflight

- [ ] Goal: No mock payment token. Steps: Review deployment config and contract addresses. Expected: Real USDC address only; no MockUSDC fallback.
- [ ] Goal: Admin/auth/legal readiness. Steps: Review auth, owner multisig, legal checklist and external audit. Expected: Real auth, multisig/timelock, completed audit and legal review before launch.

## 14. Admin Auth

- [ ] Goal: Protected route. Steps: Open `/admin` without a session. Expected: Redirects to `/admin/login`.
- [ ] Goal: Login. Steps: Enter `ADMIN_PASSWORD`. Expected: Redirects to `/admin` and HttpOnly session cookie is set.
- [ ] Goal: Logout. Steps: Click Logout in admin dashboard. Expected: Session is cleared and `/admin` requires login again.
- [ ] Goal: Admin API protection. Steps: Request `/api/referral/admin` without session. Expected: `401`.
- [ ] Goal: CSV export with session. Steps: Login and export users/referrals/xp CSV. Expected: Files download without putting secrets in URL.

## 15. PostgreSQL Preflight

- [ ] Goal: Local PostgreSQL starts. Steps: Run `docker compose -f docker-compose.postgres.yml up -d`. Expected: Postgres listens on port 5432.
- [ ] Goal: Prisma validates production URL. Steps: Set `DATABASE_URL=postgresql://skip:skip_dev_password@localhost:5432/skip?schema=public`. Expected: Prisma commands can run with the PostgreSQL schema variant.
- [ ] Goal: SQLite remains local default. Steps: Reset `DATABASE_URL=file:./dev.db`. Expected: Local app continues to run.
