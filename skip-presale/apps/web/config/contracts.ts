import type { Address } from "viem";
import skipPresaleAbi from "../abi/SkipPresale.json";
import skipTokenAbi from "../abi/SkipToken.json";
import skipTeamVestingAbi from "../abi/SkipTeamVesting.json";
import mockUsdcAbi from "../abi/MockUSDC.json";

const zeroAddress = "0x0000000000000000000000000000000000000000" as const;

export const contracts = {
  skipToken: (process.env.NEXT_PUBLIC_SKIP_TOKEN_ADDRESS || zeroAddress) as Address,
  skipPresale: (process.env.NEXT_PUBLIC_SKIP_PRESALE_ADDRESS || zeroAddress) as Address,
  skipTeamVesting: (process.env.NEXT_PUBLIC_SKIP_TEAM_VESTING_ADDRESS || zeroAddress) as Address,
  usdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS || zeroAddress) as Address
};

export const abis = {
  skipToken: skipTokenAbi,
  skipPresale: skipPresaleAbi,
  skipTeamVesting: skipTeamVestingAbi,
  usdc: mockUsdcAbi
} as const;

export function hasConfiguredContracts() {
  return contracts.skipToken !== zeroAddress && contracts.skipPresale !== zeroAddress && contracts.usdc !== zeroAddress;
}
