"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from "wagmi";
import { abis, contracts, hasConfiguredContracts } from "../config/contracts";
import { compactAddress, formatSkip, formatUsdc } from "../lib/format";
import { WalletConnectButton } from "./wallet-connect-button";

type UserInfoTuple = readonly [bigint, bigint, bigint, bigint, boolean];
type PresaleInfoTuple = readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean, bigint, bigint];

export function UserDashboard() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [events, setEvents] = useState<string[]>([]);
  const configured = hasConfiguredContracts();

  const { data: userInfo } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "getUserInfo",
    args: [address],
    query: { enabled: configured && Boolean(address), refetchInterval: 12_000 }
  });

  const { data: presaleInfo } = useReadContract({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    functionName: "getPresaleInfo",
    query: { enabled: configured, refetchInterval: 12_000 }
  });

  useWatchContractEvent({
    address: contracts.skipPresale,
    abi: abis.skipPresale,
    eventName: "TokensPurchased",
    onLogs(logs) {
      setEvents((current) => [`Purchase event observed: ${logs.length} log(s)`, ...current].slice(0, 8));
    },
    enabled: configured
  });

  const user = userInfo as UserInfoTuple | undefined;
  const info = presaleInfo as PresaleInfoTuple | undefined;
  const status = useMemo(() => {
    if (!info) return "Loading";
    if (info[8]) return "Claim enabled";
    if (info[9]) return "Refund enabled";
    if (info[7]) return "Finalized";
    return "Active or pending";
  }, [info]);

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

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Wallet" value={compactAddress(address)} />
          <Metric label="USDC contributed" value={`${formatUsdc(user?.[0])} USDC`} />
          <Metric label="SKIP purchased" value={`${formatSkip(user?.[1])} SKIP`} />
          <Metric label="Claimable SKIP" value={`${formatSkip(user?.[2])} SKIP`} />
          <Metric label="Refundable USDC" value={`${formatUsdc(user?.[3])} USDC`} />
          <Metric label="Presale status" value={status} />
        </div>

        {hash ? <p className="mt-5 break-all text-sm text-neon">Transaction: {hash}</p> : null}
        {isSuccess ? <p className="mt-2 text-sm text-neon">Transaction confirmed.</p> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={claim}
            disabled={!isConnected || (user?.[2] ?? BigInt(0)) === BigInt(0) || isPending || isConfirming}
            className="focus-ring rounded-md bg-neon px-4 py-3 font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isPending || isConfirming ? <Loader2 className="mx-auto animate-spin" /> : "Claim SKIP"}
          </button>
          <button
            onClick={refund}
            disabled={!isConnected || (user?.[3] ?? BigInt(0)) === BigInt(0) || isPending || isConfirming}
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
          {events.length ? events.map((event, index) => <div key={`${event}-${index}`}>{event}</div>) : <div>No events observed yet.</div>}
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
