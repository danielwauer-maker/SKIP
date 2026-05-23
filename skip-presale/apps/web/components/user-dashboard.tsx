"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { decodeEventLog, type Abi } from "viem";
import { useAccount, useChainId, useReadContracts, useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from "wagmi";
import { abis, contracts, hasConfiguredContracts } from "../config/contracts";
import { compactAddress, formatSkip, formatUsdc } from "../lib/format";
import { WalletConnectButton } from "./wallet-connect-button";

type UserInfoTuple = readonly [bigint, bigint, bigint, bigint, boolean];
type UserInfoObject = {
  contributed: bigint;
  purchased: bigint;
  claimable: bigint;
  refundable: bigint;
  hasClaimed: boolean;
};
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
type PurchaseEvent = {
  id: string;
  txHash: string;
  blockNumber?: bigint;
  usdcAmount: bigint;
  skipAmount: bigint;
};

export function UserDashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [events, setEvents] = useState<PurchaseEvent[]>([]);
  const seenEventsRef = useRef<Set<string>>(new Set());
  const addressRef = useRef<string | undefined>(address);
  const configured = hasConfiguredContracts();

  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  const dashboardContracts = useMemo(
    () =>
      address
        ? [
            {
              address: contracts.skipPresale,
              abi: abis.skipPresale as Abi,
              chainId,
              functionName: "getUserInfo",
              args: [address]
            },
            {
              address: contracts.skipPresale,
              abi: abis.skipPresale as Abi,
              chainId,
              functionName: "getPresaleInfo"
            },
            {
              address: contracts.skipPresale,
              abi: abis.skipPresale as Abi,
              chainId,
              functionName: "claimedAmount",
              args: [address]
            }
          ]
        : [],
    [address, chainId]
  );

  const {
    data: dashboardData,
    refetch: refetchDashboard,
    isLoading: isDashboardLoading,
    isFetching: isDashboardFetching
  } = useReadContracts({
    contracts: dashboardContracts,
    query: {
      enabled: configured && Boolean(address),
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      staleTime: 30_000
    }
  });

  const handlePurchaseLogs = useCallback(
    (logs: readonly any[]) => {
      const nextEvents: PurchaseEvent[] = [];

      for (const log of logs) {
        if (!log.transactionHash) continue;
        const eventId = `${log.transactionHash}:${log.logIndex?.toString() ?? "0"}`;
        if (seenEventsRef.current.has(eventId)) continue;

        const decoded = decodeEventLog({
          abi: abis.skipPresale,
          eventName: "TokensPurchased",
          data: log.data,
          topics: log.topics
        }) as { args: { buyer?: string; usdcAmount?: bigint; skipAmount?: bigint } };
        const args = decoded.args;
        const currentAddress = addressRef.current;
        if (currentAddress && args.buyer?.toLowerCase() !== currentAddress.toLowerCase()) continue;

        seenEventsRef.current.add(eventId);
        nextEvents.push({
          id: eventId,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber ?? undefined,
          usdcAmount: args.usdcAmount ?? BigInt(0),
          skipAmount: args.skipAmount ?? BigInt(0)
        });
      }

      if (nextEvents.length === 0) return;
      setEvents((current) => [...nextEvents, ...current].slice(0, 8));
      void refetchDashboard();
    },
    [refetchDashboard]
  );

  useEffect(() => {
    if (!isSuccess || !hash) return;
    void refetchDashboard();
  }, [hash, isSuccess, refetchDashboard]);

  useWatchContractEvent({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    eventName: "TokensPurchased",
    onLogs: handlePurchaseLogs,
    enabled: configured && Boolean(address)
  });

  const user = normalizeUserInfo(dashboardData?.[0]?.result as UserInfoTuple | UserInfoObject | undefined);
  const info = normalizePresaleInfo(dashboardData?.[1]?.result as PresaleInfoTuple | PresaleInfoObject | undefined);
  const claimed = dashboardData?.[2]?.result as bigint | undefined;
  const vestingProgress =
    user.purchased > BigInt(0)
      ? Math.min(100, Number(((claimed ?? BigInt(0)) * BigInt(10000)) / user.purchased) / 100)
      : 0;
  const status = useMemo(() => {
    if (!dashboardData?.[1]?.result) return "Loading";
    if (info.claimEnabled) return "Claim enabled";
    if (info.refundEnabled) return "Refund enabled";
    if (info.finalized) return "Finalized";
    return "Active or pending";
  }, [dashboardData, info]);

  function claim() {
    writeContract({ address: contracts.skipPresale, abi: abis.skipPresale, functionName: "claim" });
  }

  function refund() {
    writeContract({ address: contracts.skipPresale, abi: abis.skipPresale, functionName: "refund" });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-black text-white">User Dashboard</h1>
          <p className="mt-2 text-slate-400">Blockchain data is public. Contributions are visible on-chain.</p>
        </div>
        <WalletConnectButton />
      </div>

      <div className="glass rounded-lg p-6">
        {!isConnected ? <p className="text-slate-300">Connect your wallet to view your presale position.</p> : null}
        {isConnected && !configured ? <p className="text-amber-100">Contracts are not configured in environment variables.</p> : null}
        {isConnected && configured && isDashboardLoading ? <p className="text-slate-300">Loading wallet position...</p> : null}
        {isConnected && configured && isDashboardFetching && !isDashboardLoading ? (
          <p className="text-sm text-slate-500">Refreshing latest on-chain data...</p>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Wallet" value={compactAddress(address)} />
          <Metric label="USDC contributed" value={`${formatUsdc(user.contributed)} USDC`} />
          <Metric label="Purchased SKIP total" value={`${formatSkip(user.purchased)} SKIP`} />
          <Metric label="Claimed SKIP" value={`${formatSkip(claimed)} SKIP`} />
          <Metric label="Currently claimable SKIP" value={`${formatSkip(user.claimable)} SKIP`} />
          <Metric label="Refundable USDC" value={`${formatUsdc(user.refundable)} USDC`} />
          <Metric label="Presale status" value={status} />
          <Metric label="Vesting progress" value={`${vestingProgress.toFixed(1)}% claimed`} />
          <Metric label="Next claim" value={user.claimable > BigInt(0) ? "Available now" : "Unlocks linearly after finalize"} />
        </div>

        <p className="mt-5 rounded-md border border-line bg-black/30 p-4 text-sm leading-6 text-slate-300">
          Buyer vesting: 50% is claimable after successful presale finalization. The remaining 50% unlocks linearly over
          90 days from finalize. Multiple claims are supported.
        </p>

        {hash ? <p className="mt-5 break-all text-sm text-neon">Transaction: {hash}</p> : null}
        {isSuccess ? <p className="mt-2 text-sm text-neon">Transaction confirmed.</p> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={claim}
            disabled={!isConnected || user.claimable === BigInt(0) || isPending || isConfirming}
            className="focus-ring rounded-md bg-neon px-4 py-3 font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isPending || isConfirming ? <Loader2 className="mx-auto animate-spin" /> : "Claim SKIP"}
          </button>
          <button
            onClick={refund}
            disabled={!isConnected || user.refundable === BigInt(0) || isPending || isConfirming}
            className="focus-ring rounded-md border border-line px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isPending || isConfirming ? <Loader2 className="mx-auto animate-spin" /> : "Refund USDC"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-black/25 p-6">
        <h2 className="text-xl font-bold text-white">Observed transaction history</h2>
        <p className="mt-2 text-sm text-slate-400">Live events from this session appear here. Use a block explorer for full historical indexing.</p>
        <div className="mt-4 grid gap-2 text-sm text-slate-300">
          {events.length ? (
            events.map((event) => (
              <div key={event.id} className="rounded border border-line bg-black/20 p-3">
                <div className="text-neon">{compactHash(event.txHash)}</div>
                <div className="mt-1">
                  {formatUsdc(event.usdcAmount, 4)} USDC -&gt; {formatSkip(event.skipAmount)} SKIP
                </div>
                <div className="mt-1 text-xs text-slate-500">Block {event.blockNumber?.toString() ?? "pending"}</div>
              </div>
            ))
          ) : (
            <div>No events observed yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function normalizeUserInfo(userInfo?: UserInfoTuple | UserInfoObject): UserInfoObject {
  if (!userInfo) {
    return {
      contributed: BigInt(0),
      purchased: BigInt(0),
      claimable: BigInt(0),
      refundable: BigInt(0),
      hasClaimed: false
    };
  }

  if (Array.isArray(userInfo)) {
    return {
      contributed: userInfo[0],
      purchased: userInfo[1],
      claimable: userInfo[2],
      refundable: userInfo[3],
      hasClaimed: userInfo[4]
    };
  }

  return userInfo as UserInfoObject;
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

function compactHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-black/30 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 break-words font-semibold text-white">{value}</div>
    </div>
  );
}
