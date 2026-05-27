# Known Limitations

Last updated: 2026-05-25

## Contracts

- Owner privileges are simple `Ownable` controls. Mainnet requires multisig ownership and documented signer policy.
- No timelock exists for owner actions.
- Contract events do not provide per-stage breakdown for a single multi-stage buy. Analytics reconstruct stage allocation offchain.
- Development withdrawals can reduce refund liquidity until repaid if the softcap fails.
- `MockUSDC` is for local/testnet simulation only and must never be used as a mainnet payment token.

## Frontend and Admin

- Admin Auth V1 is password-session based. It is better than a frontend guard, but not a complete production access-control system.
- Admin login and CSV exports do not yet have a durable audit log.
- Admin APIs do not yet have production-grade rate limiting.
- Client-side event loading can be affected by RPC limits or missed history windows.
- Contract addresses are environment-driven and must be verified per deployment.

## Database

- SQLite is the local default.
- PostgreSQL is prepared but production backup/restore is not yet implemented.
- Dual Prisma schema variants can drift if model changes are not mirrored.

## Legal and Communication

- Existing copy avoids profit, listing and airdrop guarantees, but legal review is still required.
- Eligibility, geofencing, KYC and jurisdictional posture are not finalized.
- XP and Founder status are offchain reputation signals only and must remain non-financial in V1.

## Deployment

- Mainnet deployment is not approved.
- Public testnet deployment still needs a fresh dry-run and checklist completion.
- Ownership transfer to multisig is not yet scripted or rehearsed.

