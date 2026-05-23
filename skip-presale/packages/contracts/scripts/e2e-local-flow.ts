import { ethers, network } from "hardhat";
import type { MockUSDC, SkipPresale } from "../typechain-types";

const USDC = (value: string) => ethers.parseUnits(value, 6);

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

async function printState(presale: SkipPresale, label: string) {
  const info = await presale.getPresaleInfo();
  console.log(label, {
    totalRaised: ethers.formatUnits(info.totalRaised, 6),
    totalSold: ethers.formatUnits(info.totalSold, 18),
    currentStage: Number(info.currentStage) + 1,
    completedStageRaised: ethers.formatUnits(info.completedStageRaised, 6),
    maxDevelopmentWithdrawable: ethers.formatUnits(info.maxDevelopmentWithdrawable, 6),
    allStagesSoldOut: await presale.allStagesSoldOut(),
    finalized: info.finalized,
    claimEnabled: info.claimEnabled,
    refundEnabled: info.refundEnabled,
    vestingStart: (await presale.vestingStart()).toString()
  });
}

async function main() {
  if (network.name !== "localhost") {
    throw new Error(`e2e-local-flow is intended for localhost only. Current network: ${network.name}`);
  }

  await ethers.provider.getBlockNumber().catch(() => {
    throw new Error("Hardhat localhost is not reachable. Start it with: pnpm --filter @skip/contracts hardhat node");
  });

  const presaleAddress = readRequired("SKIP_PRESALE_ADDRESS", "skip-presale-address");
  const mockUsdcAddress = readRequired("MOCK_USDC_ADDRESS", "mock-usdc-address");
  if (!ethers.isAddress(presaleAddress)) throw new Error(`Invalid SKIP_PRESALE_ADDRESS: ${presaleAddress}`);
  if (!ethers.isAddress(mockUsdcAddress)) throw new Error(`Invalid MOCK_USDC_ADDRESS: ${mockUsdcAddress}`);

  const signers = await ethers.getSigners();
  const buyers = signers.slice(1, 5);
  if (buyers.length < 2) throw new Error("Need at least two Hardhat buyer signers.");

  const mockUsdc = (await ethers.getContractAt("MockUSDC", mockUsdcAddress)) as unknown as MockUSDC;
  const presale = (await ethers.getContractAt("SkipPresale", presaleAddress)) as unknown as SkipPresale;

  console.log("SKIP local E2E flow starting", { presale: presaleAddress, mockUsdc: mockUsdcAddress });

  for (const buyer of buyers) {
    await network.provider.send("hardhat_setBalance", [buyer.address, `0x${ethers.parseEther("1000").toString(16)}`]);
    await (await mockUsdc.mint(buyer.address, USDC("1000000"))).wait();
    await (await mockUsdc.connect(buyer).approve(presaleAddress, ethers.MaxUint256)).wait();
  }

  await (await presale.connect(buyers[0]).buy(USDC("80000"))).wait();
  await (await presale.connect(buyers[1]).buy(USDC("100000"))).wait();
  await (await presale.connect(buyers[2]).buy(USDC("70000") + 1n)).wait();

  await printState(presale, "After staged buys");
  if ((await presale.maxDevelopmentWithdrawable()) <= 0n) throw new Error("Expected development unlock after completed stages.");

  let info = await presale.getPresaleInfo();
  const latest = await ethers.provider.getBlock("latest");
  const now = BigInt(latest?.timestamp ?? 0);
  if (now <= info.endTime) {
    await network.provider.send("evm_increaseTime", [Number(info.endTime - now + 1n)]);
    await network.provider.send("evm_mine");
  }
  await (await presale.finalize()).wait();

  info = await presale.getPresaleInfo();
  const userInfo = await presale.getUserInfo(buyers[0].address);
  const claimable = await presale.claimable(buyers[0].address);

  await printState(presale, "After finalize");
  console.log("Buyer claim check", {
    buyer: buyers[0].address,
    contributed: ethers.formatUnits(userInfo.contributed, 6),
    purchased: ethers.formatUnits(userInfo.purchased, 18),
    claimable: ethers.formatUnits(claimable, 18)
  });

  if (!info.finalized || !info.claimEnabled || claimable <= 0n) {
    throw new Error("E2E flow did not reach expected finalized claim-enabled state.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
