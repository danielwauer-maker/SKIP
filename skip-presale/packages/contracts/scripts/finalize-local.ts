import { ethers, network } from "hardhat";
import type { SkipPresale } from "../typechain-types";

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

async function main() {
  if (network.name !== "localhost") {
    throw new Error(`finalize-local is intended for localhost only. Current network: ${network.name}`);
  }

  const presaleAddress = readRequired("SKIP_PRESALE_ADDRESS", "skip-presale-address");
  if (!ethers.isAddress(presaleAddress)) throw new Error(`Invalid SKIP_PRESALE_ADDRESS: ${presaleAddress}`);

  const presale = (await ethers.getContractAt("SkipPresale", presaleAddress)) as unknown as SkipPresale;
  let info = await presale.getPresaleInfo();

  if (!info.finalized) {
    try {
      await (await presale.finalize()).wait();
    } catch (error) {
      info = await presale.getPresaleInfo();
      const nowBlock = await ethers.provider.getBlock("latest");
      const now = BigInt(nowBlock?.timestamp ?? 0);
      const canTimeAdvance = info.totalRaised >= info.softCap && now <= info.endTime;

      if (!canTimeAdvance) {
        throw error;
      }

      const seconds = Number(info.endTime - now + 1n);
      await network.provider.send("evm_increaseTime", [seconds]);
      await network.provider.send("evm_mine");
      await (await presale.finalize()).wait();
    }
  }

  info = await presale.getPresaleInfo();
  console.log({
    presale: presaleAddress,
    finalized: info.finalized,
    claimEnabled: info.claimEnabled,
    refundEnabled: info.refundEnabled,
    vestingStart: (await presale.vestingStart()).toString()
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
