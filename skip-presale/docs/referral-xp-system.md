# Referral + XP + OG Founder System

This V1 system is designed for public testnet growth and community reputation. XP, Founder status and OG roles are not token rewards, airdrop guarantees, profit signals or allocation guarantees.

## XP Actions

| Action | XP | Rule |
| --- | ---: | --- |
| REGISTER_WALLET | 100 | Once per wallet |
| CONNECT_WALLET_DAILY | 25 | Once per wallet per UTC day |
| COMPLETE_TESTNET_BUY | 250 | Once after contract contribution verification |
| REFER_SIGNUP | 150 | Referrer gets XP when a referred wallet registers |
| REFER_QUALIFIED | 500 | Referrer gets XP when referred wallet qualifies |
| JOIN_COMMUNITY | 100 | Manual verification placeholder |
| BUG_REPORT | 300 | Manual verification placeholder |
| FEEDBACK_SUBMITTED | 150 | Once per wallet |
| MEME_SUBMISSION | 100 | Manual verification placeholder |

## Rank Table

| Rank | Minimum XP |
| --- | ---: |
| Visitor | 0 |
| Starter | 100 |
| Scout | 500 |
| Builder | 1,500 |
| Founder | 5,000 |
| Genesis Founder | 10,000 |
| Vanguard | 25,000 |

`isOgFounder` becomes true at Founder rank and above. A future top-wallet rule can be layered on without changing the ledger.

## Referral Qualification

A referral starts as `PENDING`. It becomes `QUALIFIED` when the referred wallet is registered and either completes a verified testnet buy or reaches at least 500 XP. Qualification awards `REFER_QUALIFIED` XP to the referrer once.

## Anti-Abuse V1

- Wallet addresses are unique and normalized lowercase.
- Self-referrals are blocked.
- Referral code attribution is not overwritten after registration.
- XP actions use dedupe keys.
- Daily connect is limited to one award per UTC day.
- Click IP and user-agent values are hashed server-side; cleartext IPs are not stored.
- Suspicious patterns are surfaced in admin analytics instead of automatically banning wallets.

## Future Token Rewards

Future eligibility may consider XP, Founder status or OG roles, but V1 intentionally does not promise token rewards, airdrops, profits or allocations.
