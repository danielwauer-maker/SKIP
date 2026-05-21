"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useAccount, useChainId, useReadContract, useReadContracts, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { formatUnits } from "viem";
import { abis, contracts, hasConfiguredContracts } from "../config/contracts";
import { targetChain, targetChainId } from "../config/chains";
import { presaleStages } from "../config/presale";
import { formatSkip, formatUsdc, parseUsdc, percent } from "../lib/format";
import { validateContribution } from "../lib/validation";
import { Countdown } from "./countdown";
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
  bigint
];

export function PresaleCard() {
  const [amount, setAmount] = useState("100");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const configured = hasConfiguredContracts();
  const usdcAmount = useMemo(() => parseUsdc(amount), [amount]);

  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const { data: presaleInfo, refetch: refetchPresale } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "getPresaleInfo",
    query: { enabled: configured, refetchInterval: 12_000 }
  });

  const info = presaleInfo as PresaleInfoTuple | undefined;

  const { data: stage } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "getStage",
    args: [info?.[4] ?? BigInt(0)],
    query: { enabled: configured && info !== undefined, refetchInterval: 12_000 }
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
    query: { enabled: configured && Boolean(address), refetchInterval: 12_000 }
  });

  const usdcBalance = erc20Data?.[0]?.result as bigint | undefined;
  const allowance = erc20Data?.[1]?.result as bigint | undefined;
  const needsApproval = usdcAmount > BigInt(0) && (allowance ?? BigInt(0)) < usdcAmount;
  const stageTuple = stage as readonly [bigint, bigint, bigint] | undefined;
  const stageProgress = percent(stageTuple?.[1], stageTuple?.[0]);
  const totalProgress = percent(info?.[0], info?.[3]);
  const validation = validateContribution(amount, usdcBalance);
  const wrongNetwork = isConnected && chainId !== targetChainId;

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
    if (!receipt) return;
    void refetchPresale();
    void refetchErc20();
  }, [receipt, refetchErc20, refetchPresale]);

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
              <span>Stage Price: {presaleStages[Number(info?.[4] || BigInt(0))] || presaleStages[0]} USDC</span>
            </div>
            {validation ? (
              <div className="flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                <AlertTriangle size={16} /> {validation}
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
                disabled={!isConnected || wrongNetwork || !needsApproval || Boolean(validation) || isPending || isConfirming}
                className="focus-ring rounded-md border border-line px-4 py-3 font-semibold text-white transition hover:border-neon disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isPending && needsApproval ? <Loader2 className="mx-auto animate-spin" /> : "Approve USDC"}
              </button>
              <button
                onClick={buy}
                disabled={!isConnected || wrongNetwork || needsApproval || Boolean(validation) || isPending || isConfirming}
                className="focus-ring rounded-md bg-neon px-4 py-3 font-semibold text-ink transition hover:bg-acid disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isPending || isConfirming ? <Loader2 className="mx-auto animate-spin" /> : "Buy $SKIP"}
              </button>
            </div>
          </div>
        </div>

        <div className="glass rounded-lg p-6 sm:p-8">
          <div className="mb-6">
            <div className="text-sm uppercase tracking-[0.2em] text-neon">Stage {Number(info?.[4] || BigInt(0)) + 1} / 12</div>
            <h3 className="mt-2 text-2xl font-bold text-white">Presale Progress</h3>
          </div>
          <div className="grid gap-5">
            <StageProgress label="Current stage" value={stageProgress} />
            <StageProgress label="Raised / hardcap" value={totalProgress} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="Raised" value={`${formatUsdc(info?.[0])} USDC`} />
              <Metric label="Hardcap" value={`${formatUsdc(info?.[3])} USDC`} />
              <Metric label="Sold" value={`${formatSkip(info?.[1])} SKIP`} />
              <Metric label="Dev unlocked" value={`${formatUsdc(info?.[10])} USDC`} />
            </div>
            <Countdown endTime={info?.[6]} />
            <p className="rounded-md border border-line bg-black/30 p-4 text-sm leading-6 text-slate-300">
              Up to 25% of raised funds may be used during the presale for development, infrastructure, legal review
              and community growth. Remaining funds stay locked until successful completion.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-black/30 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 break-words font-semibold text-white">{value}</div>
    </div>
  );
}
