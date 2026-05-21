export const tokenomics = [
  { label: "Presale", value: 25 },
  { label: "Community Rewards", value: 30 },
  { label: "Liquidity", value: 15 },
  { label: "Marketing", value: 10 },
  { label: "Ecosystem/App Development", value: 10 },
  { label: "Team Vesting", value: 7 },
  { label: "Reserve", value: 3 }
] as const;

export const presaleStages = [
  "0.000004",
  "0.000005",
  "0.000006",
  "0.000008",
  "0.000009",
  "0.000011",
  "0.000013",
  "0.000016",
  "0.000020",
  "0.000025",
  "0.000031",
  "0.000038"
] as const;

export const stageTokenCap = 20_000_000_000;
export const totalSupply = 1_000_000_000_000;
export const hardCapUsdc = Number(process.env.NEXT_PUBLIC_HARDCAP_USDC || 3_720_000);
