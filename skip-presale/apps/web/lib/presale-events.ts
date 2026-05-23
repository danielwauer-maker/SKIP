import { decodeEventLog, type Abi, type PublicClient } from "viem";
import { abis, contracts } from "../config/contracts";
import type { PurchaseEvent } from "../types/admin";

export async function loadPurchaseEvents(publicClient: PublicClient, lookbackBlocks: bigint): Promise<PurchaseEvent[]> {
  const latest = await publicClient.getBlockNumber();
  const fromBlock = latest > lookbackBlocks ? latest - lookbackBlocks : 0n;
  const logs = await publicClient.getLogs({
    address: contracts.skipPresale,
    event: {
      type: "event",
      name: "TokensPurchased",
      inputs: [
        { indexed: true, name: "buyer", type: "address" },
        { indexed: false, name: "usdcAmount", type: "uint256" },
        { indexed: false, name: "skipAmount", type: "uint256" }
      ]
    },
    fromBlock,
    toBlock: latest
  });

  const seen = new Set<string>();
  const events: PurchaseEvent[] = [];

  for (const log of logs) {
    const id = `${log.transactionHash}:${log.logIndex}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const decoded = decodeEventLog({
      abi: abis.skipPresale as Abi,
      eventName: "TokensPurchased",
      data: log.data,
      topics: log.topics
    }) as unknown as { args: { buyer: `0x${string}`; usdcAmount: bigint; skipAmount: bigint } };

    events.push({
      id,
      buyer: decoded.args.buyer,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      usdcAmount: decoded.args.usdcAmount,
      skipAmount: decoded.args.skipAmount
    });
  }

  return events.sort((a, b) => {
    if (a.blockNumber === b.blockNumber) return a.logIndex - b.logIndex;
    return a.blockNumber < b.blockNumber ? -1 : 1;
  });
}
