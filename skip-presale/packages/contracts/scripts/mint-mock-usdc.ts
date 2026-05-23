import { ethers } from "hardhat";

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
  const mockUsdcAddress = readRequired("MOCK_USDC_ADDRESS", "mock-usdc-address");
  const recipient = readRequired("RECIPIENT_ADDRESS", "recipient-address");
  const amount = process.env.AMOUNT_USDC || getArg("amount-usdc") || "100000";

  if (!ethers.isAddress(mockUsdcAddress)) {
    throw new Error(`Invalid MOCK_USDC_ADDRESS: ${mockUsdcAddress}`);
  }
  if (!ethers.isAddress(recipient)) {
    throw new Error(`Invalid RECIPIENT_ADDRESS: ${recipient}`);
  }

  const amountUnits = ethers.parseUnits(amount, 6);
  const mockUsdc = await ethers.getContractAt("MockUSDC", mockUsdcAddress);
  const tx = await mockUsdc.mint(recipient, amountUnits);
  await tx.wait();

  const balance = await mockUsdc.balanceOf(recipient);

  console.log({
    recipient,
    amountUsdc: amount,
    mockUsdc: mockUsdcAddress,
    newBalanceUsdc: ethers.formatUnits(balance, 6),
    txHash: tx.hash
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
