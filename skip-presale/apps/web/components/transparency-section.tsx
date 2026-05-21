"use client";

import { useReadContract } from "wagmi";
import { abis, contracts, hasConfiguredContracts } from "../config/contracts";
import { formatSkip, formatUsdc } from "../lib/format";

type PresaleInfoTuple = readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean, bigint, bigint];

export function TransparencySection() {
  const { data } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "getPresaleInfo",
    query: { enabled: hasConfiguredContracts(), refetchInterval: 12_000 }
  });
  const info = data as PresaleInfoTuple | undefined;
  const lockedFunds =
    (info?.[0] ?? BigInt(0)) > (info?.[10] ?? BigInt(0))
      ? (info?.[0] ?? BigInt(0)) - (info?.[10] ?? BigInt(0))
      : BigInt(0);
  const remainingTokens = BigInt("240000000000000000000000000000") - (info?.[1] ?? BigInt(0));

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-4xl font-black text-white">Live Transparency</h2>
      <p className="mt-3 max-w-3xl text-slate-300">
        Contract-readable metrics for raised funds, development unlocks, locked funds, current stage and token sale
        progress.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="totalRaised" value={`${formatUsdc(info?.[0])} USDC`} />
        <Metric label="developmentWithdrawn" value={`${formatUsdc(info?.[10])} USDC`} />
        <Metric label="lockedFunds" value={`${formatUsdc(lockedFunds)} USDC`} />
        <Metric label="treasuryAllocation" value="25% max development unlock" />
        <Metric label="currentStage" value={`${Number(info?.[4] ?? BigInt(0)) + 1} / 12`} />
        <Metric label="totalSold" value={`${formatSkip(info?.[1])} SKIP`} />
        <Metric label="remainingTokens" value={`${formatSkip(remainingTokens)} SKIP`} />
        <Metric label="maxDevWithdrawable" value={`${formatUsdc(info?.[11])} USDC`} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-black/30 p-5">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 break-words text-lg font-bold text-white">{value}</div>
    </div>
  );
}
