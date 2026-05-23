import { ethers, network } from "hardhat";
import type { MockUSDC } from "../typechain-types";

function getArg(name: string) {
  const index = process.argv.findIndex((arg) => arg === `--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function readRequired(name: string, cliName: string) {
  const value = process.env[name] || getArg(cliName);
  if (!value) {
    throw new Error(`Missing ${name}. Provide it through env or --${cliName}.`);
  }
  return value;
}

async function main() {
  if (network.name !== "localhost") {
    throw new Error(`faucet-dev is intended for localhost only. Current network: ${network.name}`);
  }

  const recipient = readRequired("RECIPIENT_ADDRESS", "recipient-address");
  const mockUsdcAddress = readRequired("MOCK_USDC_ADDRESS", "mock-usdc-address");
  const amount = process.env.AMOUNT_USDC || getArg("amount-usdc") || "5000000";

  if (!ethers.isAddress(recipient)) throw new Error(`Invalid RECIPIENT_ADDRESS: ${recipient}`);
  if (!ethers.isAddress(mockUsdcAddress)) throw new Error(`Invalid MOCK_USDC_ADDRESS: ${mockUsdcAddress}`);

  await network.provider.send("hardhat_setBalance", [recipient, `0x${ethers.parseEther("1000").toString(16)}`]);

  const mockUsdc = (await ethers.getContractAt("MockUSDC", mockUsdcAddress)) as unknown as MockUSDC;
  const tx = await mockUsdc.mint(recipient, ethers.parseUnits(amount, 6));
  await tx.wait();

  const ethBalance = await ethers.provider.getBalance(recipient);
  const usdcBalance = await mockUsdc.balanceOf(recipient);

  console.log({
    recipient,
    ethBalance: ethers.formatEther(ethBalance),
    amountUsdcMinted: amount,
    mockUsdc: mockUsdcAddress,
    mockUsdcBalance: ethers.formatUnits(usdcBalance, 6),
    txHash: tx.hash
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
