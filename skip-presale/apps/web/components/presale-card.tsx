"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useAccount, useChainId, useReadContract, useReadContracts, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { abis, contracts, hasConfiguredContracts } from "../config/contracts";
import { targetChain, targetChainId } from "../config/chains";
import { getPublicEnvWarnings } from "../lib/env-validation";
import { formatBpsToPercent, formatDurationDays, formatSkip, formatUsdc, parseUsdc, percent } from "../lib/format";
import { validateContribution } from "../lib/validation";
import { StageProgress } from "./stage-progress";
import { WalletConnectButton } from "./wallet-connect-button";

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
type StageTuple = readonly [bigint, bigint, bigint];
type StageObject = {
  tokenCap: bigint;
  sold: bigint;
  priceUsdc: bigint;
};

export function PresaleCard() {
  const [amount, setAmount] = useState("100");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const configured = hasConfiguredContracts();
  const usdcAmount = useMemo(() => parseUsdc(amount), [amount]);

  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: presaleInfo, refetch: refetchPresale } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "getPresaleInfo",
    query: { enabled: configured, refetchOnWindowFocus: false, staleTime: 30_000 }
  });

  const info = normalizePresaleInfo(presaleInfo as PresaleInfoTuple | PresaleInfoObject | undefined);
  const currentStageIndex = info.currentStage;
  const nextStageIndex = currentStageIndex < BigInt(11) ? currentStageIndex + BigInt(1) : undefined;

  const { data: stage, refetch: refetchStage } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "getStage",
    args: [currentStageIndex],
    query: { enabled: configured && presaleInfo !== undefined, refetchOnWindowFocus: false, staleTime: 30_000 }
  });

  const { data: nextStage, refetch: refetchNextStage } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "getStage",
    args: [nextStageIndex ?? currentStageIndex],
    query: { enabled: configured && nextStageIndex !== undefined, refetchOnWindowFocus: false, staleTime: 30_000 }
  });

  const { data: totalStageRaise, refetch: refetchTotalStageRaise } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "totalStageRaise",
    query: { enabled: configured, refetchOnWindowFocus: false, staleTime: Number.POSITIVE_INFINITY }
  });

  const { data: allStagesSoldOut } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "allStagesSoldOut",
    query: { enabled: configured, refetchOnWindowFocus: false, staleTime: 30_000 }
  });

  const { data: vestingConfig } = useReadContracts({
    contracts: [
      { address: contracts.skipPresale, abi: abis.skipPresale, functionName: "IMMEDIATE_CLAIM_BPS" },
      { address: contracts.skipPresale, abi: abis.skipPresale, functionName: "BUYER_VESTING_DURATION" }
    ],
    query: { enabled: configured, refetchOnWindowFocus: false, staleTime: Number.POSITIVE_INFINITY }
  });

  const { data: paused } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "paused",
    query: { enabled: configured, refetchOnWindowFocus: false, staleTime: 30_000 }
  });

  const { data: quote } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "previewTokens",
    args: [usdcAmount],
    query: { enabled: configured && usdcAmount > BigInt(0) }
  });

  const { data: erc20Data, refetch: refetchErc20 } = useReadContracts({
    contracts: [
      {
        address: contracts.usdc,
        abi: abis.usdc,
        functionName: "balanceOf",
        args: [address]
      },
      {
        address: contracts.usdc,
        abi: abis.usdc,
        functionName: "allowance",
        args: [address, contracts.skipPresale]
      }
    ],
    query: { enabled: configured && Boolean(address), refetchOnWindowFocus: false, staleTime: 30_000 }
  });

  const usdcBalance = erc20Data?.[0]?.result as bigint | undefined;
  const allowance = erc20Data?.[1]?.result as bigint | undefined;
  const needsApproval = usdcAmount > BigInt(0) && (allowance ?? BigInt(0)) < usdcAmount;
  const currentStage = normalizeStage(stage as StageTuple | StageObject | undefined);
  const followingStage = normalizeStage(nextStage as StageTuple | StageObject | undefined);
  const immediateClaimBps = vestingConfig?.[0]?.result as bigint | undefined;
  const vestingDuration = vestingConfig?.[1]?.result as bigint | undefined;
  const linearClaimBps = immediateClaimBps === undefined ? undefined : 10_000n - immediateClaimBps;
  const currentStageRemaining = currentStage.tokenCap > currentStage.sold ? currentStage.tokenCap - currentStage.sold : BigInt(0);
  const usdcUntilNextStage = (currentStageRemaining * currentStage.priceUsdc) / BigInt("1000000000000000000");
  const stageProgress = percent(currentStage.sold, currentStage.tokenCap);
  const totalProgress = percent(info.totalRaised, info.hardCap);
  const validation = validateContribution(amount, usdcBalance);
  const wrongNetwork = isConnected && chainId !== targetChainId;
  const saleClosed = info.finalized || info.totalRaised >= info.hardCap || Boolean(allStagesSoldOut) || info.refundEnabled || info.claimEnabled;
  const buyBlockedReason =
    paused ? "Presale is paused." :
    info.refundEnabled ? "Refund mode is enabled. Use the dashboard to refund." :
    info.claimEnabled ? "Claim mode is enabled. Use the dashboard to claim." :
    info.finalized ? "Presale is finalized." :
    info.totalRaised >= info.hardCap ? "Hardcap reached." :
    allStagesSoldOut ? "All stages are sold out." :
    null;
  const amountCrossesStage = usdcAmount > usdcUntilNextStage && usdcUntilNextStage > 0n;
  const largeBuyWarning = amountCrossesStage || usdcAmount >= BigInt(250_000) * BigInt(1_000_000);
  const envWarnings = getPublicEnvWarnings("presale");

  async function approve() {
    writeContract({
      address: contracts.usdc,
      abi: abis.usdc,
      functionName: "approve",
      args: [contracts.skipPresale, usdcAmount]
    });
  }

  async function buy() {
    writeContract({
      address: contracts.skipPresale,
      abi: abis.skipPresale,
      functionName: "buy",
      args: [usdcAmount]
    });
  }

  useEffect(() => {
    if (!receipt || !isSuccess) return;
    void refetchPresale();
    void refetchStage();
    void refetchNextStage();
    void refetchTotalStageRaise();
    void refetchErc20();
  }, [isSuccess, receipt, refetchErc20, refetchNextStage, refetchPresale, refetchStage, refetchTotalStageRaise]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12" id="presale">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="glass rounded-lg p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Presale Access</h2>
              <p className="mt-2 text-sm text-slate-400">Pay with USDC on {targetChain.name}. Contract data is public.</p>
            </div>
            <WalletConnectButton />
          </div>

          {!configured ? (
            <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              Contract addresses are not configured yet. Deploy contracts and set the web environment variables.
            </div>
          ) : null}

          {envWarnings.length && process.env.NODE_ENV !== "production" ? (
            <div className="mt-4 rounded-md border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              <div className="font-semibold">Developer preflight warnings</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {envWarnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          ) : null}

          {wrongNetwork ? (
            <button
              className="focus-ring mt-4 w-full rounded-md bg-neon px-4 py-3 font-semibold text-ink"
              onClick={() => switchChain({ chainId: targetChainId })}
            >
              Switch to {targetChain.name}
            </button>
          ) : null}

          <div className="mt-6 grid gap-4">
            <label className="text-sm font-medium text-slate-300" htmlFor="usdc">
              USDC amount
            </label>
            <input
              id="usdc"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              className="focus-ring rounded-md border border-line bg-black/40 px-4 py-4 text-2xl font-semibold text-white"
              placeholder="100"
            />
            <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
              <span>USDC Balance: {formatUsdc(usdcBalance, 4)}</span>
              <span>Expected SKIP: {formatSkip(quote as bigint | undefined)}</span>
              <span>Allowance: {formatUsdc(allowance, 4)} USDC</span>
              <span>Stage Price: {formatStagePrice(currentStage.priceUsdc)} USDC</span>
            </div>
            {validation ? (
              <div className="flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                <AlertTriangle size={16} /> {validation}
              </div>
            ) : null}
            {buyBlockedReason ? (
              <div className="flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                <AlertTriangle size={16} /> {buyBlockedReason}
              </div>
            ) : null}
            {largeBuyWarning && !buyBlockedReason ? (
              <div className="rounded-md border border-line bg-black/30 p-3 text-sm leading-6 text-slate-300">
                This amount may cross a stage boundary or create a larger transaction. Consider buying in smaller stage-sized blocks for clearer pricing and lower gas risk.
              </div>
            ) : null}
            {error ? (
              <div className="rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
                {error.message}
              </div>
            ) : null}
            {hash ? (
              <div className="rounded-md border border-line bg-black/30 p-3 text-sm text-slate-300">
                Transaction: <span className="break-all text-neon">{hash}</span>
              </div>
            ) : null}
            {receipt ? (
              <div className="flex items-center gap-2 rounded-md border border-neon/30 bg-neon/10 p-3 text-sm text-neon">
                <CheckCircle2 size={16} /> Transaction confirmed.
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={approve}
                disabled={!isConnected || wrongNetwork || saleClosed || Boolean(paused) || !needsApproval || Boolean(validation) || isPending || isConfirming}
                className="focus-ring rounded-md border border-line px-4 py-3 font-semibold text-white transition hover:border-neon disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isPending && needsApproval ? <Loader2 className="mx-auto animate-spin" /> : "Approve USDC"}
              </button>
              <button
                onClick={buy}
                disabled={!isConnected || wrongNetwork || saleClosed || Boolean(paused) || needsApproval || Boolean(validation) || isPending || isConfirming}
                className="focus-ring rounded-md bg-neon px-4 py-3 font-semibold text-ink transition hover:bg-acid disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isPending || isConfirming ? <Loader2 className="mx-auto animate-spin" /> : "Buy $SKIP"}
              </button>
            </div>
          </div>
        </div>

        <div className="glass rounded-lg p-6 sm:p-8">
          <div className="mb-6">
            <div className="text-sm uppercase tracking-[0.2em] text-neon">Stage {Number(info.currentStage) + 1} / 12</div>
            <h3 className="mt-2 text-2xl font-bold text-white">Presale Progress</h3>
          </div>
          <div className="grid gap-5">
            <StageProgress label="Current stage" value={stageProgress} />
            <StageProgress label="Raised / hardcap" value={totalProgress} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="Raised" value={`${formatUsdc(info.totalRaised)} USDC`} />
              <Metric label="Hardcap" value={`${formatUsdc(info.hardCap)} USDC`} />
              <Metric label="Sold" value={`${formatSkip(info.totalSold)} SKIP`} />
              <Metric label="Dev unlocked" value={`${formatUsdc(info.developmentWithdrawn)} USDC`} />
              <Metric label="Current stage" value={`${Number(info.currentStage) + 1} / 12`} />
              <Metric label="Current stage price" value={`${formatStagePrice(currentStage.priceUsdc)} USDC`} />
              <Metric label="Sold in stage" value={`${formatSkip(currentStage.sold)} SKIP`} />
              <Metric label="Remaining in stage" value={`${formatSkip(currentStageRemaining)} SKIP`} />
              <Metric label="USDC until next stage" value={`${formatUsdc(usdcUntilNextStage)} USDC`} />
              <Metric
                label="Next stage price"
                value={nextStageIndex === undefined ? "Final stage" : `${formatStagePrice(followingStage.priceUsdc)} USDC`}
              />
              <Metric label="Total stage raise" value={`${formatUsdc(totalStageRaise as bigint | undefined)} USDC`} />
            </div>
            <div className="rounded-md border border-line bg-black/30 p-4 text-sm leading-6 text-slate-300">
              <div className="font-semibold text-neon">Stage-based presale</div>
              <div>Current stage remains active until sold out.</div>
              <div>Next price activates automatically after this stage sells out.</div>
              <div>Stage-based pricing. No artificial countdown pressure.</div>
              <div className="mt-2 text-slate-500">Maximum presale end timestamp: {formatDate(info.endTime)}</div>
            </div>
            <p className="rounded-md border border-line bg-black/30 p-4 text-sm leading-6 text-slate-300">
              Buyer claim: {formatBpsToPercent(immediateClaimBps)} after successful presale finalization, remaining{" "}
              {formatBpsToPercent(linearClaimBps)} linearly over {formatDurationDays(vestingDuration)}.
            </p>
            <p className="rounded-md border border-line bg-black/30 p-4 text-sm leading-6 text-slate-300">
              25% of funds from fully completed stages may be used during the presale for development, infrastructure,
              legal review and community growth. Remaining funds stay locked until successful completion.
            </p>
          </div>
        </div>
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

function normalizeStage(stage?: StageTuple | StageObject): StageObject {
  if (!stage) {
    return { tokenCap: BigInt(0), sold: BigInt(0), priceUsdc: BigInt(0) };
  }

  if (Array.isArray(stage)) {
    return { tokenCap: stage[0], sold: stage[1], priceUsdc: stage[2] };
  }

  return stage as StageObject;
}

function formatStagePrice(priceUsdc?: bigint) {
  return (Number(priceUsdc ?? BigInt(0)) / 1_000_000).toFixed(6);
}

function formatDate(timestamp?: bigint) {
  if (!timestamp || timestamp === BigInt(0)) return "Not configured";
  return new Date(Number(timestamp) * 1000).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-black/30 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 break-words font-semibold text-white">{value}</div>
    </div>
  );
}
