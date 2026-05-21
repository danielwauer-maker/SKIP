import { ethers, run } from "hardhat";
import { exportAbis } from "./export-abi";

const PRESALE_ALLOCATION = ethers.parseUnits("240000000000", 18);

async function maybeVerify(address: string, args: unknown[]) {
  if (!process.env.POLYGONSCAN_API_KEY) return;
  try {
    await run("verify:verify", { address, constructorArguments: args });
  } catch (error) {
    console.warn(`Verification skipped/failed for ${address}:`, error);
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const now = Math.floor(Date.now() / 1000);
  const start = Number(process.env.PRESALE_START || now + 10 * 60);
  const end = Number(process.env.PRESALE_END || now + 30 * 24 * 60 * 60);

  const usdcAddress = process.env.USDC_ADDRESS;
  const usdc = usdcAddress
    ? await ethers.getContractAt("MockUSDC", usdcAddress)
    : await ethers.deployContract("MockUSDC", [deployer.address]);
  await usdc.waitForDeployment();

  const skipArgs = [deployer.address];
  const skip = await ethers.deployContract("SkipToken", skipArgs);
  await skip.waitForDeployment();

  const presaleArgs = [await skip.getAddress(), await usdc.getAddress(), start, end, deployer.address];
  const presale = await ethers.deployContract("SkipPresale", presaleArgs);
  await presale.waitForDeployment();

  const teamVestingArgs = [
    await skip.getAddress(),
    process.env.TEAM_BENEFICIARY || deployer.address,
    start,
    deployer.address
  ];
  const teamVesting = await ethers.deployContract("SkipTeamVesting", teamVestingArgs);
  await teamVesting.waitForDeployment();

  await (await skip.transfer(await presale.getAddress(), PRESALE_ALLOCATION)).wait();
  if (process.env.TEAM_VESTING_AMOUNT) {
    await (await skip.transfer(await teamVesting.getAddress(), ethers.parseUnits(process.env.TEAM_VESTING_AMOUNT, 18))).wait();
  }
  await exportAbis();

  if (!usdcAddress) await maybeVerify(await usdc.getAddress(), [deployer.address]);
  await maybeVerify(await skip.getAddress(), skipArgs);
  await maybeVerify(await presale.getAddress(), presaleArgs);
  await maybeVerify(await teamVesting.getAddress(), teamVestingArgs);

  console.log({
    network: "polygon-amoy",
    deployer: deployer.address,
    usdc: await usdc.getAddress(),
    skipToken: await skip.getAddress(),
    skipPresale: await presale.getAddress(),
    skipTeamVesting: await teamVesting.getAddress(),
    presaleAllocation: PRESALE_ALLOCATION.toString(),
    teamVestingAmount: process.env.TEAM_VESTING_AMOUNT || "0",
    start,
    end
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
