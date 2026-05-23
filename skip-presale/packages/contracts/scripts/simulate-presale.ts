import { ethers, network } from "hardhat";
import type { MockUSDC, SkipPresale } from "../typechain-types";

const USDC = (value: string) => ethers.parseUnits(value, 6);
const STAGE_RAISES = [
  USDC("80000"),
  USDC("100000"),
  USDC("120000"),
  USDC("160000"),
  USDC("180000"),
  USDC("220000"),
  USDC("260000"),
  USDC("320000"),
  USDC("400000"),
  USDC("500000"),
  USDC("620000"),
  USDC("760000")
] as const;

function getArg(name: string) {
  const index = process.argv.findIndex((arg) => arg === `--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function readRequired(name: string, cliName: string) {
  const value = process.env[name] || getArg(cliName);
  if (!value) throw new Error(`Missing ${name}. Provide it through env or --${cliName}.`);
  return value;
}

function readMode() {
  const mode = process.env.MODE || getArg("mode") || "softcap";
  if (!["softcap", "hardcap", "sellout"].includes(mode)) {
    throw new Error(`Invalid MODE: ${mode}. Use softcap, hardcap, or sellout.`);
  }
  return mode;
}

async function main() {
  if (network.name !== "localhost") {
    throw new Error(`simulate-presale is intended for localhost only. Current network: ${network.name}`);
  }

  const presaleAddress = readRequired("SKIP_PRESALE_ADDRESS", "skip-presale-address");
  const mockUsdcAddress = readRequired("MOCK_USDC_ADDRESS", "mock-usdc-address");
  const mode = readMode();

  if (!ethers.isAddress(presaleAddress)) throw new Error(`Invalid SKIP_PRESALE_ADDRESS: ${presaleAddress}`);
  if (!ethers.isAddress(mockUsdcAddress)) throw new Error(`Invalid MOCK_USDC_ADDRESS: ${mockUsdcAddress}`);

  const signers = await ethers.getSigners();
  const buyers = signers.slice(1, 8);
  if (buyers.length === 0) throw new Error("No Hardhat buyer signers available.");

  const mockUsdc = (await ethers.getContractAt("MockUSDC", mockUsdcAddress)) as unknown as MockUSDC;
  const presale = (await ethers.getContractAt("SkipPresale", presaleAddress)) as unknown as SkipPresale;
  const target = mode === "softcap" ? USDC("250000") : await presale.HARD_CAP();
  const plan = mode === "softcap" ? [USDC("80000"), USDC("100000"), USDC("70000")] : STAGE_RAISES;

  for (const buyer of buyers) {
    await (await mockUsdc.mint(buyer.address, USDC("5000000"))).wait();
    await (await mockUsdc.connect(buyer).approve(presaleAddress, ethers.MaxUint256)).wait();
  }

  let buyerIndex = 0;
  for (const amount of plan) {
    const info = await presale.getPresaleInfo();
    if (info.totalRaised >= target) break;
    if (mode === "sellout" && (await presale.allStagesSoldOut())) break;

    const remaining = target - info.totalRaised;
    const buyAmount = amount > remaining ? remaining : amount;
    const buyer = buyers[buyerIndex % buyers.length];
    await (await presale.connect(buyer).buy(buyAmount)).wait();
    buyerIndex += 1;
  }

  const info = await presale.getPresaleInfo();
  console.log({
    mode,
    presale: presaleAddress,
    mockUsdc: mockUsdcAddress,
    totalRaised: ethers.formatUnits(info.totalRaised, 6),
    totalSold: ethers.formatUnits(info.totalSold, 18),
    currentStage: Number(info.currentStage) + 1,
    allStagesSoldOut: await presale.allStagesSoldOut(),
    completedStageRaised: ethers.formatUnits(await presale.completedStageRaised(), 6),
    maxDevelopmentWithdrawable: ethers.formatUnits(await presale.maxDevelopmentWithdrawable(), 6)
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
