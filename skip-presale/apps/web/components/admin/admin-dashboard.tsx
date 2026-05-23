"use client";

import { useMemo, useState } from "react";
import { usePublicClient, useReadContracts } from "wagmi";
import type { Abi } from "viem";
import { abis, contracts } from "../../config/contracts";
import { buildBuyerAggregates, buildKpis, buildStageAggregates, buildStageAllocations, detectRiskAlerts, emptyPresaleInfo, normalizePresaleInfo, normalizeStage } from "../../lib/admin-analytics";
import { formatSkip, formatUsdc, percent } from "../../lib/format";
import { loadPurchaseEvents } from "../../lib/presale-events";
import type { BuyerAggregate, PurchaseEvent } from "../../types/admin";
import { AdminBuyerTable } from "./admin-buyer-table";
import { AdminKpiCard } from "./admin-kpi-card";
import { AdminPlaceholderPanel } from "./admin-placeholder-panel";
import { AdminRecentTransactions } from "./admin-recent-transactions";
import { AdminRefreshButton } from "./admin-refresh-button";
import { AdminRiskPanel } from "./admin-risk-panel";
import { AdminStageTable } from "./admin-stage-table";
import { AdminTopWallets } from "./admin-top-wallets";
import { AdminTreasuryPanel } from "./admin-treasury-panel";
import { AdminVestingPanel } from "./admin-vesting-panel";

const tabs = ["Overview", "Stages", "Buyers", "Transactions", "Treasury", "Vesting", "Risk", "Growth"] as const;
type Tab = (typeof tabs)[number];

export function AdminDashboard() {
  const publicClient = usePublicClient();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [events, setEvents] = useState<PurchaseEvent[]>([]);
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>();
  const lookback = BigInt(process.env.NEXT_PUBLIC_ADMIN_EVENT_LOOKBACK_BLOCKS || "50000");

  const stageContracts = Array.from({ length: 12 }, (_, index) => ({
    address: contracts.skipPresale,
    abi: abis.skipPresale as Abi,
    functionName: "getStage",
    args: [BigInt(index)]
  }));
  const adminReadContracts = [
    { address: contracts.skipPresale, abi: abis.skipPresale as Abi, functionName: "getPresaleInfo" },
    { address: contracts.skipPresale, abi: abis.skipPresale as Abi, functionName: "allStagesSoldOut" },
    { address: contracts.skipPresale, abi: abis.skipPresale as Abi, functionName: "paused" },
    { address: contracts.skipPresale, abi: abis.skipPresale as Abi, functionName: "owner" },
    { address: contracts.skipPresale, abi: abis.skipPresale as Abi, functionName: "vestingStart" },
    { address: contracts.skipPresale, abi: abis.skipPresale as Abi, functionName: "BUYER_VESTING_DURATION" },
    { address: contracts.skipPresale, abi: abis.skipPresale as Abi, functionName: "IMMEDIATE_CLAIM_BPS" },
    { address: contracts.skipToken, abi: abis.skipToken as Abi, functionName: "totalSupply" },
    { address: contracts.skipToken, abi: abis.skipToken as Abi, functionName: "balanceOf", args: [contracts.skipPresale] },
    { address: contracts.usdc, abi: abis.usdc as Abi, functionName: "balanceOf", args: [contracts.skipPresale] },
    { address: contracts.skipTeamVesting, abi: abis.skipTeamVesting as Abi, functionName: "beneficiary" },
    { address: contracts.skipTeamVesting, abi: abis.skipTeamVesting as Abi, functionName: "startTime" },
    { address: contracts.skipTeamVesting, abi: abis.skipTeamVesting as Abi, functionName: "CLIFF_DURATION" },
    { address: contracts.skipTeamVesting, abi: abis.skipTeamVesting as Abi, functionName: "VESTING_DURATION" },
    { address: contracts.skipTeamVesting, abi: abis.skipTeamVesting as Abi, functionName: "released" },
    { address: contracts.skipTeamVesting, abi: abis.skipTeamVesting as Abi, functionName: "releasable" },
    { address: contracts.skipToken, abi: abis.skipToken as Abi, functionName: "balanceOf", args: [contracts.skipTeamVesting] },
    ...stageContracts
  ];

  const { data, refetch, isLoading, isFetching, error } = useReadContracts({
    contracts: adminReadContracts,
    query: { refetchOnWindowFocus: false, staleTime: 30_000 }
  });

  const presale = normalizePresaleInfo(data?.[0]?.result) ?? emptyPresaleInfo();
  const stages = Array.from({ length: 12 }, (_, index) => normalizeStage(data?.[17 + index]?.result, index));
  const allStagesSoldOut = data?.[1]?.result as boolean | undefined;
  const paused = data?.[2]?.result as boolean | undefined;
  const owner = data?.[3]?.result as string | undefined;
  const tokenTotalSupply = data?.[7]?.result as bigint | undefined;
  const presaleTokenBalance = data?.[8]?.result as bigint | undefined;
  const contractUsdcBalance = data?.[9]?.result as bigint | undefined;
  const teamAllocation = ((data?.[16]?.result as bigint | undefined) ?? 0n) + ((data?.[14]?.result as bigint | undefined) ?? 0n);

  const allocations = useMemo(() => buildStageAllocations(events, stages), [events, stages]);
  const stageAggregates = useMemo(() => buildStageAggregates(stages, allocations), [allocations, stages]);
  const rawBuyers = useMemo(() => buildBuyerAggregates(events, presale), [events, presale]);

  const buyerAddresses = useMemo(() => rawBuyers.slice(0, 200).map((buyer) => buyer.wallet), [rawBuyers]);
  const buyerReadContracts = useMemo(
    () =>
      buyerAddresses.flatMap((wallet) => [
        { address: contracts.skipPresale, abi: abis.skipPresale as Abi, functionName: "getUserInfo", args: [wallet] },
        { address: contracts.skipPresale, abi: abis.skipPresale as Abi, functionName: "claimedAmount", args: [wallet] }
      ]),
    [buyerAddresses]
  );
  const { data: buyerReadData } = useReadContracts({
    contracts: buyerReadContracts,
    query: { enabled: buyerReadContracts.length > 0, refetchOnWindowFocus: false, staleTime: 30_000 }
  });

  const buyers = useMemo(() => {
    const readMap = new Map<string, { claimed: bigint; claimable: bigint; refundable: bigint }>();
    buyerAddresses.forEach((wallet, index) => {
      const user = normalizeUserInfo(buyerReadData?.[index * 2]?.result);
      const claimed = (buyerReadData?.[index * 2 + 1]?.result as bigint | undefined) ?? 0n;
      readMap.set(wallet.toLowerCase(), { claimed, claimable: user.claimable, refundable: user.refundable });
    });
    return rawBuyers.map((buyer): BuyerAggregate => ({ ...buyer, ...(readMap.get(buyer.wallet.toLowerCase()) ?? {}) }));
  }, [buyerAddresses, buyerReadData, rawBuyers]);

  const kpis = useMemo(() => buildKpis(events, buyers), [buyers, events]);
  const alerts = useMemo(() => detectRiskAlerts(events, presale, contractUsdcBalance), [contractUsdcBalance, events, presale]);

  async function refreshAll(loadEvents = false) {
    setEventError(null);
    await refetch();
    if (loadEvents) await refreshEvents();
    setLastRefreshed(new Date());
  }

  async function refreshEvents() {
    if (!publicClient) {
      setEventError("No public client available for this chain.");
      return;
    }
    setEventsLoading(true);
    setEventError(null);
    try {
      const loaded = await loadPurchaseEvents(publicClient, lookback);
      setEvents(loaded);
      setLastRefreshed(new Date());
    } catch (loadError) {
      setEventError(loadError instanceof Error ? loadError.message : "Failed to load purchase events.");
    } finally {
      setEventsLoading(false);
    }
  }

  const currentStage = stages[Number(presale.currentStage)] ?? stages[0];
  const currentStageProgress = percent(currentStage?.sold, currentStage?.tokenCap);
  const currentStageRemainingUsdc = currentStage ? ((currentStage.tokenCap - currentStage.sold) * currentStage.priceUsdc) / 10n ** 18n : 0n;
  const remainingHardcap = presale.hardCap > presale.totalRaised ? presale.hardCap - presale.totalRaised : 0n;

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-8">
      <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
        Admin dashboard is not protected yet. Do not deploy publicly without authentication. Frontend guard only. Real auth required before public deployment.
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-black text-white">Founder Control Center</h1>
          <p className="mt-2 text-slate-400">Read-only operational analytics for $SKIP presale monitoring.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AdminRefreshButton onRefresh={() => void refreshAll(false)} loading={isFetching || isLoading} lastRefreshed={lastRefreshed} />
          <button onClick={() => void refreshEvents()} disabled={eventsLoading} className="rounded-md bg-neon px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">
            {eventsLoading ? "Loading events..." : "Load events"}
          </button>
        </div>
      </div>

      {error ? <div className="mt-4 rounded border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{error.message}</div> : null}
      {eventError ? <div className="mt-4 rounded border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">{eventError}</div> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-md border px-4 py-2 text-sm font-semibold ${activeTab === tab ? "border-neon bg-neon text-ink" : "border-line text-white hover:border-neon"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "Overview" ? (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <AdminKpiCard label="Total Raised" value={`${formatUsdc(presale.totalRaised)} USDC`} />
              <AdminKpiCard label="Hardcap" value={`${formatUsdc(presale.hardCap)} USDC`} />
              <AdminKpiCard label="Hardcap Progress" value={`${percent(presale.totalRaised, presale.hardCap).toFixed(2)}%`} />
              <AdminKpiCard label="Total SKIP Sold" value={`${formatSkip(presale.totalSold)} SKIP`} />
              <AdminKpiCard label="Total Buyers" value={kpis.totalBuyers.toString()} hint="Requires loaded events" />
              <AdminKpiCard label="Total Transactions" value={kpis.totalTransactions.toString()} hint="Requires loaded events" />
              <AdminKpiCard label="Current Stage" value={`${Number(presale.currentStage) + 1} / 12`} />
              <AdminKpiCard label="Current Stage Price" value={`${((Number(currentStage?.priceUsdc ?? 0n)) / 1_000_000).toFixed(6)} USDC`} />
              <AdminKpiCard label="Current Stage Progress" value={`${currentStageProgress.toFixed(2)}%`} />
              <AdminKpiCard label="USDC until next stage" value={`${formatUsdc(currentStageRemainingUsdc)} USDC`} />
              <AdminKpiCard label="USDC until hardcap" value={`${formatUsdc(remainingHardcap)} USDC`} />
              <AdminKpiCard label="Average Buy" value={`${formatUsdc(kpis.averageBuy)} USDC`} />
              <AdminKpiCard label="Median Buy" value={`${formatUsdc(kpis.medianBuy)} USDC`} />
              <AdminKpiCard label="Largest Buy" value={`${formatUsdc(kpis.largestBuy)} USDC`} />
              <AdminKpiCard label="Smallest Buy" value={`${formatUsdc(kpis.smallestBuy)} USDC`} />
              <AdminKpiCard label="Last Purchase Block" value={kpis.lastPurchaseBlock?.toString() ?? "n/a"} />
            </div>
            <AdminTopWallets buyers={buyers} kpis={kpis} />
          </div>
        ) : null}
        {activeTab === "Stages" ? <AdminStageTable stages={stageAggregates} /> : null}
        {activeTab === "Buyers" ? <AdminBuyerTable buyers={buyers} /> : null}
        {activeTab === "Transactions" ? <AdminRecentTransactions events={events} allocations={allocations} /> : null}
        {activeTab === "Treasury" ? <AdminTreasuryPanel presale={presale} contractUsdcBalance={contractUsdcBalance} allStagesSoldOut={allStagesSoldOut} /> : null}
        {activeTab === "Vesting" ? (
          <AdminVestingPanel
            presale={presale}
            totalPurchased={presale.totalSold}
            totalClaimed={buyers.reduce((sum, buyer) => sum + buyer.claimed, 0n)}
            team={{
              beneficiary: data?.[10]?.result as string | undefined,
              startTime: data?.[11]?.result as bigint | undefined,
              cliff: data?.[12]?.result as bigint | undefined,
              duration: data?.[13]?.result as bigint | undefined,
              released: data?.[14]?.result as bigint | undefined,
              releasable: data?.[15]?.result as bigint | undefined,
              allocation: teamAllocation
            }}
          />
        ) : null}
        {activeTab === "Risk" ? <AdminRiskPanel presale={presale} alerts={alerts} paused={paused} owner={owner} totalSupply={tokenTotalSupply} presaleTokenBalance={presaleTokenBalance} /> : null}
        {activeTab === "Growth" ? (
          <div className="grid gap-6">
            <AdminPlaceholderPanel
              title="Referral / XP"
              metrics={["Total Referrals", "Top Referrers", "Referral Conversion", "XP issued", "Founder ranks"]}
              todos={["Backend required", "Database required", "Anti-Sybil required", "Referral links", "XP ledger", "Leaderboard"]}
            />
            <AdminPlaceholderPanel
              title="Marketing Analytics"
              metrics={["Visits", "Wallet Connect Rate", "Buy Conversion Rate", "Campaign Source", "UTM Tracking", "Telegram/Discord Growth", "X/TikTok Campaigns"]}
              todos={["Tracking integration", "Consent/privacy design", "UTM capture", "Campaign dashboard", "Community growth imports"]}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}

function normalizeUserInfo(value: unknown) {
  if (!value) return { claimable: 0n, refundable: 0n };
  if (Array.isArray(value)) return { claimable: value[2] as bigint, refundable: value[3] as bigint };
  return value as { claimable: bigint; refundable: bigint };
}
