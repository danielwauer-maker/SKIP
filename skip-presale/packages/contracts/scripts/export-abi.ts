import { artifacts } from "hardhat";
import fs from "node:fs/promises";
import path from "node:path";

const contracts = ["SkipToken", "SkipPresale", "MockUSDC"];

export async function exportAbis() {
  const outputDir = path.resolve("../../apps/web/abi");
  await fs.mkdir(outputDir, { recursive: true });

  for (const contractName of contracts) {
    const artifact = await artifacts.readArtifact(contractName);
    const outputPath = path.join(outputDir, `${contractName}.json`);
    await fs.writeFile(outputPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`Exported ${contractName} ABI to ${outputPath}`);
  }
}

if (require.main === module) {
  exportAbis().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
