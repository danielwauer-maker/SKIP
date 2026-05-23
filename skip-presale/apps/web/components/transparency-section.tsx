"use client";

import { useReadContract } from "wagmi";
import { abis, contracts, hasConfiguredContracts } from "../config/contracts";
import { formatSkip, formatUsdc } from "../lib/format";

type PresaleInfoTuple = readonly [
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  boolean,
  boolean,
  boolean,
  bigint,
  bigint,
  bigint
];
type PresaleInfoObject = {
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

export function TransparencySection() {
  const { data } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "getPresaleInfo",
    query: { enabled: hasConfiguredContracts(), refetchOnWindowFocus: false, staleTime: 30_000 }
  });
  const info = normalizePresaleInfo(data as PresaleInfoTuple | PresaleInfoObject | undefined);
  const lockedFunds =
    info.totalRaised > info.developmentWithdrawn
      ? info.totalRaised - info.developmentWithdrawn
      : BigInt(0);
  const remainingTokens = BigInt("240000000000000000000000000000") - info.totalSold;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-4xl font-black text-white">Live Transparency</h2>
      <p className="mt-3 max-w-3xl text-slate-300">
        Contract-readable metrics for raised funds, development unlocks, locked funds, current stage and token sale
        progress.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="totalRaised" value={`${formatUsdc(info.totalRaised)} USDC`} />
        <Metric label="completedStageRaised" value={`${formatUsdc(info.completedStageRaised)} USDC`} />
        <Metric label="developmentWithdrawn" value={`${formatUsdc(info.developmentWithdrawn)} USDC`} />
        <Metric label="lockedFunds" value={`${formatUsdc(lockedFunds)} USDC`} />
        <Metric label="treasuryAllocation" value="25% of completed stages only" />
        <Metric label="currentStage" value={`${Number(info.currentStage) + 1} / 12`} />
        <Metric label="totalSold" value={`${formatSkip(info.totalSold)} SKIP`} />
        <Metric label="remainingTokens" value={`${formatSkip(remainingTokens)} SKIP`} />
        <Metric label="maxDevWithdrawable" value={`${formatUsdc(info.maxDevelopmentWithdrawable)} USDC`} />
      </div>
    </section>
  );
}

function normalizePresaleInfo(info?: PresaleInfoTuple | PresaleInfoObject): PresaleInfoObject {
  if (!info) {
    return {
      totalRaised: BigInt(0),
      totalSold: BigInt(0),
      softCap: BigInt(0),
      hardCap: BigInt(0),
      currentStage: BigInt(0),
      startTime: BigInt(0),
      endTime: BigInt(0),
      finalized: false,
      claimEnabled: false,
      refundEnabled: false,
      developmentWithdrawn: BigInt(0),
      maxDevelopmentWithdrawable: BigInt(0),
      completedStageRaised: BigInt(0)
    };
  }

  if (Array.isArray(info)) {
    return {
      totalRaised: info[0],
      totalSold: info[1],
      softCap: info[2],
      hardCap: info[3],
      currentStage: info[4],
      startTime: info[5],
      endTime: info[6],
      finalized: info[7],
      claimEnabled: info[8],
      refundEnabled: info[9],
      developmentWithdrawn: info[10],
      maxDevelopmentWithdrawable: info[11],
      completedStageRaised: info[12]
    };
  }

  return info as PresaleInfoObject;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-black/30 p-5">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 break-words text-lg font-bold text-white">{value}</div>
    </div>
  );
}
