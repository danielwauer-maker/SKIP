import type { Address } from "viem";
import type { AdminKpis, BuyerAggregate, PresaleInfo, PurchaseEvent, StageAggregate, StageAllocation, StageInfo, WhaleTier } from "../types/admin";
import { percent } from "./format";

const BPS_DENOMINATOR = 10_000;
const DEVELOPMENT_BPS = 2_500;

export function emptyPresaleInfo(): PresaleInfo {
  return {
    totalRaised: 0n,
    totalSold: 0n,
    softCap: 0n,
    hardCap: 0n,
    currentStage: 0n,
    startTime: 0n,
    endTime: 0n,
    finalized: false,
    claimEnabled: false,
    refundEnabled: false,
    developmentWithdrawn: 0n,
    maxDevelopmentWithdrawable: 0n,
    completedStageRaised: 0n
  };
}

export function normalizePresaleInfo(value: unknown): PresaleInfo {
  if (!value) return emptyPresaleInfo();
  if (Array.isArray(value)) {
    return {
      totalRaised: value[0],
      totalSold: value[1],
      softCap: value[2],
      hardCap: value[3],
      currentStage: value[4],
      startTime: value[5],
      endTime: value[6],
      finalized: value[7],
      claimEnabled: value[8],
      refundEnabled: value[9],
      developmentWithdrawn: value[10],
      maxDevelopmentWithdrawable: value[11],
      completedStageRaised: value[12]
    };
  }
  return value as PresaleInfo;
}

export function normalizeStage(value: unknown, index: number): StageInfo {
  if (!value) return { stageNumber: index + 1, tokenCap: 0n, sold: 0n, priceUsdc: 0n };
  if (Array.isArray(value)) {
    return { stageNumber: index + 1, tokenCap: value[0], sold: value[1], priceUsdc: value[2] };
  }
  const stage = value as { tokenCap: bigint; sold: bigint; priceUsdc: bigint };
  return { stageNumber: index + 1, tokenCap: stage.tokenCap, sold: stage.sold, priceUsdc: stage.priceUsdc };
}

export function stageRaiseTarget(stage: StageInfo) {
  return (stage.tokenCap * stage.priceUsdc) / 10n ** 18n;
}

export function buildStageAllocations(events: PurchaseEvent[], stages: StageInfo[]): StageAllocation[] {
  const remaining = stages.map((stage) => stage.tokenCap);
  const allocations: StageAllocation[] = [];
  let stageIndex = 0;

  for (const event of events) {
    let tokensLeft = event.skipAmount;
    while (tokensLeft > 0n && stageIndex < stages.length) {
      const tokenChunk = tokensLeft > remaining[stageIndex] ? remaining[stageIndex] : tokensLeft;
      if (tokenChunk === 0n) {
        stageIndex += 1;
        continue;
      }

      allocations.push({
        stageNumber: stageIndex + 1,
        buyer: event.buyer,
        txHash: event.txHash,
        blockNumber: event.blockNumber,
        skipAmount: tokenChunk,
        usdcAmount: (tokenChunk * stages[stageIndex].priceUsdc) / 10n ** 18n
      });

      remaining[stageIndex] -= tokenChunk;
      tokensLeft -= tokenChunk;
      if (remaining[stageIndex] === 0n) stageIndex += 1;
    }
  }

  return allocations;
}

export function buildStageAggregates(stages: StageInfo[], allocations: StageAllocation[]): StageAggregate[] {
  return stages.map((stage) => {
    const stageEvents = allocations.filter((allocation) => allocation.stageNumber === stage.stageNumber);
    const buyers = new Set(stageEvents.map((event) => event.buyer.toLowerCase())).size;
    const stageRaised = (stage.sold * stage.priceUsdc) / 10n ** 18n;
    const largestBuy = maxBigInt(stageEvents.map((event) => event.usdcAmount));
    const totalEventRaised = sumBigInt(stageEvents.map((event) => event.usdcAmount));
    return {
      ...stage,
      tokensRemaining: stage.tokenCap > stage.sold ? stage.tokenCap - stage.sold : 0n,
      stageRaised,
      stageRaiseTarget: stageRaiseTarget(stage),
      progress: percent(stage.sold, stage.tokenCap),
      buyers,
      transactions: stageEvents.length,
      averageBuy: stageEvents.length ? totalEventRaised / BigInt(stageEvents.length) : 0n,
      largestBuy,
      isCompleted: stage.sold >= stage.tokenCap,
      developmentUnlock: stage.sold >= stage.tokenCap ? (stageRaiseTarget(stage) * BigInt(DEVELOPMENT_BPS)) / BigInt(BPS_DENOMINATOR) : 0n,
      estimatedFromEvents: true
    };
  });
}

export function buildBuyerAggregates(events: PurchaseEvent[], presale: PresaleInfo): BuyerAggregate[] {
  const map = new Map<string, BuyerAggregate>();

  for (const event of events) {
    const key = event.buyer.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        wallet: event.buyer,
        totalContributed: event.usdcAmount,
        totalPurchased: event.skipAmount,
        claimed: 0n,
        claimable: 0n,
        refundable: 0n,
        firstPurchaseBlock: event.blockNumber,
        lastPurchaseBlock: event.blockNumber,
        purchaseCount: 1,
        averageBuy: event.usdcAmount,
        largestBuy: event.usdcAmount,
        shareOfPresaleBps: 0,
        whaleTier: whaleTier(event.usdcAmount)
      });
      continue;
    }

    existing.totalContributed += event.usdcAmount;
    existing.totalPurchased += event.skipAmount;
    existing.lastPurchaseBlock = event.blockNumber > existing.lastPurchaseBlock ? event.blockNumber : existing.lastPurchaseBlock;
    existing.firstPurchaseBlock = event.blockNumber < existing.firstPurchaseBlock ? event.blockNumber : existing.firstPurchaseBlock;
    existing.purchaseCount += 1;
    existing.largestBuy = event.usdcAmount > existing.largestBuy ? event.usdcAmount : existing.largestBuy;
    existing.averageBuy = existing.totalContributed / BigInt(existing.purchaseCount);
    existing.whaleTier = whaleTier(existing.totalContributed);
  }

  return Array.from(map.values()).map((buyer) => ({
    ...buyer,
    shareOfPresaleBps: presale.totalRaised > 0n ? Number((buyer.totalContributed * 10_000n) / presale.totalRaised) : 0
  }));
}

export function buildKpis(events: PurchaseEvent[], buyers: BuyerAggregate[]): AdminKpis {
  const sortedBuys = events.map((event) => event.usdcAmount).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const totalRaised = sumBigInt(events.map((event) => event.usdcAmount));
  return {
    totalBuyers: buyers.length,
    totalTransactions: events.length,
    averageBuy: events.length ? totalRaised / BigInt(events.length) : 0n,
    medianBuy: medianBigInt(sortedBuys),
    largestBuy: maxBigInt(sortedBuys),
    smallestBuy: sortedBuys[0] ?? 0n,
    top1Share: concentrationShare(buyers, 1),
    top5Share: concentrationShare(buyers, 5),
    top10Share: concentrationShare(buyers, 10),
    concentrationScore: approximateGini(buyers.map((buyer) => buyer.totalContributed)),
    lastPurchaseBlock: events.at(-1)?.blockNumber
  };
}

export function whaleTier(usdcAmount: bigint): WhaleTier {
  if (usdcAmount >= 250_000n * 10n ** 6n) return "Mega Whale";
  if (usdcAmount >= 50_000n * 10n ** 6n) return "Whale";
  if (usdcAmount >= 10_000n * 10n ** 6n) return "Large";
  if (usdcAmount >= 1_000n * 10n ** 6n) return "Medium";
  return "Small";
}

export function detectRiskAlerts(events: PurchaseEvent[], presale: PresaleInfo, contractUsdcBalance?: bigint) {
  const alerts: string[] = [];
  if (contractUsdcBalance !== undefined && contractUsdcBalance < presale.totalRaised && !presale.claimEnabled) {
    alerts.push("Possible refund coverage issue: contract USDC balance is below totalRaised.");
  }
  if (presale.developmentWithdrawn > 0n && !presale.claimEnabled) {
    alerts.push("Development funds were withdrawn. If softcap fails, repayDevelopmentFunds may be required before refunds.");
  }
  if (presale.maxDevelopmentWithdrawable > 0n) {
    alerts.push("Development funds are currently withdrawable under completed-stage treasury rules.");
  }

  const byWallet = new Map<string, number>();
  const byAmount = new Map<string, number>();
  for (const event of events) {
    byWallet.set(event.buyer.toLowerCase(), (byWallet.get(event.buyer.toLowerCase()) ?? 0) + 1);
    byAmount.set(event.usdcAmount.toString(), (byAmount.get(event.usdcAmount.toString()) ?? 0) + 1);
    if (event.usdcAmount >= 250_000n * 10n ** 6n) alerts.push(`Possible large buy alert: ${event.buyer} contributed at least 250,000 USDC.`);
  }
  if (Array.from(byWallet.values()).some((count) => count >= 5)) alerts.push("Possible repeated-buy activity: one or more wallets bought at least 5 times.");
  if (Array.from(byAmount.values()).some((count) => count >= 5)) alerts.push("Possible bot pattern: identical buy amount repeated at least 5 times.");
  return Array.from(new Set(alerts));
}

function concentrationShare(buyers: BuyerAggregate[], count: number) {
  const total = sumBigInt(buyers.map((buyer) => buyer.totalContributed));
  if (total === 0n) return 0;
  const top = sumBigInt([...buyers].sort((a, b) => (a.totalContributed > b.totalContributed ? -1 : 1)).slice(0, count).map((buyer) => buyer.totalContributed));
  return Number((top * 10_000n) / total) / 100;
}

function approximateGini(values: bigint[]) {
  if (values.length === 0) return 0;
  const sorted = values.map(Number).sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  if (sum === 0) return 0;
  const weighted = sorted.reduce((acc, value, index) => acc + (index + 1) * value, 0);
  return Number(((2 * weighted) / (values.length * sum) - (values.length + 1) / values.length).toFixed(3));
}

function medianBigInt(values: bigint[]) {
  if (values.length === 0) return 0n;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0 ? (values[middle - 1] + values[middle]) / 2n : values[middle];
}

function maxBigInt(values: bigint[]) {
  return values.reduce((max, value) => (value > max ? value : max), 0n);
}

function sumBigInt(values: bigint[]) {
  return values.reduce((sum, value) => sum + value, 0n);
}
