# Launch Checklist

- Complete contract tests and review all edge cases.
- Deploy to Polygon Amoy and verify source code.
- Run frontend against testnet contracts with real wallet flows.
- Confirm USDC address and decimals for target chain.
- Confirm presale start and end timestamps.
- Transfer exact presale allocation to the presale contract.
- Deploy `SkipTeamVesting` with the correct beneficiary and start timestamp.
- Transfer the intended team allocation to the vesting contract.
- Validate ABI export after deployment.
- Validate completed-stage treasury unlock math on testnet.
- Validate buyer vesting claims at finalize, day 45 and day 90.
- Confirm risk warnings on every page.
- Run security review before mainnet.
- Run legal review before any public launch.
- Keep staking out of Phase 1; design it later as a separate audited module.
