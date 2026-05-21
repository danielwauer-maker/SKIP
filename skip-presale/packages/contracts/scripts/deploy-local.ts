import { ethers } from "hardhat";
import { exportAbis } from "./export-abi";

const PRESALE_ALLOCATION = ethers.parseUnits("240000000000", 18);

async function main() {
  const [deployer] = await ethers.getSigners();
  const now = Math.floor(Date.now() / 1000);
  const start = Number(process.env.PRESALE_START || now + 60);
  const end = Number(process.env.PRESALE_END || now + 30 * 24 * 60 * 60);

  const usdcAddress = process.env.USDC_ADDRESS;
  const usdc = usdcAddress
    ? await ethers.getContractAt("MockUSDC", usdcAddress)
    : await ethers.deployContract("MockUSDC", [deployer.address]);
  await usdc.waitForDeployment();

  const skip = await ethers.deployContract("SkipToken", [deployer.address]);
  await skip.waitForDeployment();

  const presale = await ethers.deployContract("SkipPresale", [
    await skip.getAddress(),
    await usdc.getAddress(),
    start,
    end,
    deployer.address
  ]);
  await presale.waitForDeployment();

  await (await skip.transfer(await presale.getAddress(), PRESALE_ALLOCATION)).wait();

  await exportAbis();

  console.log({
    network: "localhost",
    deployer: deployer.address,
    usdc: await usdc.getAddress(),
    skipToken: await skip.getAddress(),
    skipPresale: await presale.getAddress(),
    presaleAllocation: PRESALE_ALLOCATION.toString(),
    start,
    end
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
