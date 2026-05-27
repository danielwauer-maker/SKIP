# Risk Register

Last updated: 2026-05-25

## Severity Key

- Critical: blocks mainnet.
- High: blocks public testnet or creates material user/funds/security risk.
- Medium: acceptable for controlled testnet with monitoring, not acceptable to ignore long term.
- Low: cleanup, clarity or operational polish.

| ID | Risk | Severity | Area | Current Mitigation | Required Next Action |
| --- | --- | --- | --- | --- | --- |
| R-001 | No independent external smart contract audit yet. | Critical | Contracts | Internal tests and review only. | Prepare audit package and book external review before mainnet. |
| R-002 | Owner privileges are controlled by a single owner address unless deployed to multisig. | Critical | Ownership | Ownable access is explicit and simple. | Define multisig policy and deploy/transfer ownership to multisig before mainnet. |
| R-003 | No timelock or delayed execution for sensitive owner actions. | High | Governance | Public events expose owner actions. | Decide if pause/finalize/withdraw operations need multisig-only or timelock before mainnet. |
| R-004 | Development treasury withdrawals can reduce refund liquidity before an unsuccessful finalize. | High | Treasury/refund | Refund activation requires enough USDC and `repayDevelopmentFunds` exists. | Document operator procedure and test repayment runbook during dry-run. |
| R-005 | Admin Auth V1 is password-session based and has no roles, audit log or rate limiting. | High | Admin | HttpOnly signed session cookie; admin API checks session. | Add rate limiting, audit logging and production auth policy before public admin exposure. |
| R-006 | Production database backup/restore is not operationally proven. | High | Database | SQLite local, PostgreSQL schema variant and Docker Compose exist. | Add backup/restore scripts and run a restore drill. |
| R-007 | Referral/XP system can be Sybil-gamed. | Medium | Growth | Self-referral block, dedupe keys, hashed click metadata and suspicious flags. | Add rate limiting, stronger admin review workflow and abuse thresholds. |
| R-008 | Frontend depends on correct env addresses and WalletConnect/Reown setup. | Medium | Deployment | Env warning helpers exist. | Add deployment preflight command and verify public testnet env before launch. |
| R-009 | Mainnet legal/compliance position is unresolved. | Critical | Legal | Risk disclaimers and legal review checklist exist. | Complete legal review for sale terms, eligibility, geofencing and copy. |
| R-010 | RPC/indexing/event loading may miss or duplicate analytics under production conditions. | Medium | Analytics | Event IDs dedupe loaded logs in UI. | Add backend indexing or persisted event snapshots before mainnet analytics reliance. |
| R-011 | `MockUSDC` is intentionally mintable by owner and must never be used as mainnet payment token. | Critical | Deployment | Amoy scripts split mock and USDC modes; safe default aborts. | Add final deployment checklist confirmation and automated mainnet mock-address block. |
| R-012 | Public docs can drift from deployed bytecode if contract params change without regeneration. | Medium | Docs/frontend | Vesting UI is now contract-driven. | Add a release checklist requiring ABI export and deployed constant verification. |

## Current Highest Risks

1. External audit missing.
2. Multisig/timelock ownership not finalized.
3. Production DB backup/restore not proven.
4. Admin security is V1 only.
5. Legal review and eligibility policy are not complete.

