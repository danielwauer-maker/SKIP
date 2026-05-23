import type { Address, Hash } from "viem";

export type PresaleInfo = {
  totalRaised: bigint;
  totalSold: bigint;
  softCap: bigint;
  hardCap: bigint;
  currentStage: bigint;
  startTime: bigint;
  endTime: bigint;
  finalized: boolean;
  claimEnabled: boolean;
  refundEnabled: boolean;
  developmentWithdrawn: bigint;
  maxDevelopmentWithdrawable: bigint;
  completedStageRaised: bigint;
};

export type StageInfo = {
  stageNumber: number;
  tokenCap: bigint;
  sold: bigint;
  priceUsdc: bigint;
};

export type PurchaseEvent = {
  id: string;
  buyer: Address;
  txHash: Hash;
  blockNumber: bigint;
  logIndex: number;
  usdcAmount: bigint;
  skipAmount: bigint;
};

export type StageAllocation = {
  stageNumber: number;
  buyer: Address;
  txHash: Hash;
  blockNumber: bigint;
  usdcAmount: bigint;
  skipAmount: bigint;
};

export type BuyerAggregate = {
  wallet: Address;
  totalContributed: bigint;
  totalPurchased: bigint;
  claimed: bigint;
  claimable: bigint;
  refundable: bigint;
  firstPurchaseBlock: bigint;
  lastPurchaseBlock: bigint;
  purchaseCount: number;
  averageBuy: bigint;
  largestBuy: bigint;
  shareOfPresaleBps: number;
  whaleTier: WhaleTier;
};

export type StageAggregate = StageInfo & {
  tokensRemaining: bigint;
  stageRaised: bigint;
  stageRaiseTarget: bigint;
  progress: number;
  buyers: number;
  transactions: number;
  averageBuy: bigint;
  largestBuy: bigint;
  isCompleted: boolean;
  developmentUnlock: bigint;
  estimatedFromEvents: boolean;
};

export type AdminKpis = {
  totalBuyers: number;
  totalTransactions: number;
  averageBuy: bigint;
  medianBuy: bigint;
  largestBuy: bigint;
  smallestBuy: bigint;
  top1Share: number;
  top5Share: number;
  top10Share: number;
  concentrationScore: number;
  lastPurchaseBlock?: bigint;
};

export type WhaleTier = "Small" | "Medium" | "Large" | "Whale" | "Mega Whale";

export type SortKey = "contributed" | "purchased" | "txCount";
