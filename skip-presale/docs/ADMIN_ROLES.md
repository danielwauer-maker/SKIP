# Admin Roles

Last updated: 2026-05-25

## Current Admin Model

Admin V1 is intentionally simple:

- `/admin/login` accepts an admin password.
- `ADMIN_PASSWORD` is checked server-side.
- `ADMIN_SESSION_SECRET` signs an HttpOnly session cookie.
- Session TTL is 8 hours.
- Cookie settings:
  - `HttpOnly`
  - `SameSite=Lax`
  - `secure` in production
- Admin APIs check the same session.
- `REFERRAL_ADMIN_SECRET` remains as a legacy scripted-access fallback for selected APIs.

## Current Capabilities

The admin dashboard is read-oriented and operational:

- presale analytics,
- stage analytics,
- buyer analytics,
- treasury status,
- vesting status,
- risk signals,
- referral/growth analytics,
- CSV exports for users, referrals and XP ledger.

The admin dashboard does not hold private keys and does not execute onchain owner actions.

## Current Roles

| Role | Status | Scope |
| --- | --- | --- |
| Public user | Implemented | Presale UI, dashboard, referrals. |
| Admin V1 | Implemented | Password-session access to `/admin` and admin APIs. |
| Contract owner | Implemented onchain | Owner-only contract actions through wallet/signing, not through admin UI. |
| Read-only analyst | Not separated | Same as Admin V1 today. |
| Security operator | Not separated | Same as owner/admin depending on action. |

## Production Gaps

- No role-based access control in admin UI.
- No durable admin audit log.
- No login rate limiting or lockout.
- No MFA.
- No session revocation list.
- Legacy `REFERRAL_ADMIN_SECRET` fallback should be reviewed before production.

## Mainnet Requirement

Before mainnet:

1. Move contract owner authority to a multisig.
2. Keep private keys out of the web app and admin dashboard.
3. Add admin audit logging.
4. Add rate limiting to login and admin APIs.
5. Decide whether admin has one role or separate read-only/export roles.
6. Document emergency contacts and session secret rotation.

## Non-Goals

- Admin UI must not become a hot-wallet control panel.
- Admin users must not receive private keys through the app.
- Admin access must not imply legal or financial guarantees.

