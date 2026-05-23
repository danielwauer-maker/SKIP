import { useMemo, useState } from "react";
import { downloadCsv } from "../../lib/csv";
import { compactAddress, formatSkip, formatUsdc } from "../../lib/format";
import type { BuyerAggregate, SortKey, WhaleTier } from "../../types/admin";

const tiers: Array<WhaleTier | "All"> = ["All", "Small", "Medium", "Large", "Whale", "Mega Whale"];

export function AdminBuyerTable({ buyers }: { buyers: BuyerAggregate[] }) {
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<WhaleTier | "All">("All");
  const [sort, setSort] = useState<SortKey>("contributed");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return buyers
      .filter((buyer) => buyer.wallet.toLowerCase().includes(q))
      .filter((buyer) => tier === "All" || buyer.whaleTier === tier)
      .sort((a, b) => {
        if (sort === "purchased") return a.totalPurchased > b.totalPurchased ? -1 : 1;
        if (sort === "txCount") return b.purchaseCount - a.purchaseCount;
        return a.totalContributed > b.totalContributed ? -1 : 1;
      });
  }, [buyers, query, sort, tier]);

  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <section className="rounded-lg border border-line bg-black/25 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Buyer Analytics</h2>
        <button
          className="rounded-md border border-line px-3 py-2 text-sm text-white hover:border-neon"
          onClick={() =>
            downloadCsv(
              "skip-buyers.csv",
              filtered.map((buyer) => ({
                wallet: buyer.wallet,
                contributedUsdc: formatUsdc(buyer.totalContributed),
                purchasedSkip: formatSkip(buyer.totalPurchased),
                claimedSkip: formatSkip(buyer.claimed),
                claimableSkip: formatSkip(buyer.claimable),
                refundableUsdc: formatUsdc(buyer.refundable),
                firstPurchaseBlock: buyer.firstPurchaseBlock,
                lastPurchaseBlock: buyer.lastPurchaseBlock,
                purchaseCount: buyer.purchaseCount,
                averageBuyUsdc: formatUsdc(buyer.averageBuy),
                largestBuyUsdc: formatUsdc(buyer.largestBuy),
                shareOfPresalePercent: buyer.shareOfPresaleBps / 100,
                whaleTier: buyer.whaleTier
              }))
            )
          }
        >
          Export CSV
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search wallet" className="rounded-md border border-line bg-black/40 px-3 py-2 text-white" />
        <select value={tier} onChange={(event) => { setTier(event.target.value as WhaleTier | "All"); setPage(0); }} className="rounded-md border border-line bg-black/40 px-3 py-2 text-white">
          {tiers.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="rounded-md border border-line bg-black/40 px-3 py-2 text-white">
          <option value="contributed">Sort by contributed</option>
          <option value="purchased">Sort by purchased</option>
          <option value="txCount">Sort by tx count</option>
        </select>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[1300px] w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              {["Wallet", "Contributed", "Purchased", "Claimed", "Claimable", "Refundable", "First", "Last", "Tx", "Average", "Largest", "Share", "Tier"].map((head) => (
                <th key={head} className="border-b border-line px-3 py-2">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((buyer) => (
              <tr key={buyer.wallet} className="border-b border-line/60 text-slate-300">
                <td className="px-3 py-3 text-neon">{compactAddress(buyer.wallet)}</td>
                <td className="px-3 py-3">{formatUsdc(buyer.totalContributed)}</td>
                <td className="px-3 py-3">{formatSkip(buyer.totalPurchased)}</td>
                <td className="px-3 py-3">{formatSkip(buyer.claimed)}</td>
                <td className="px-3 py-3">{formatSkip(buyer.claimable)}</td>
                <td className="px-3 py-3">{formatUsdc(buyer.refundable)}</td>
                <td className="px-3 py-3">{buyer.firstPurchaseBlock.toString()}</td>
                <td className="px-3 py-3">{buyer.lastPurchaseBlock.toString()}</td>
                <td className="px-3 py-3">{buyer.purchaseCount}</td>
                <td className="px-3 py-3">{formatUsdc(buyer.averageBuy)}</td>
                <td className="px-3 py-3">{formatUsdc(buyer.largestBuy)}</td>
                <td className="px-3 py-3">{(buyer.shareOfPresaleBps / 100).toFixed(2)}%</td>
                <td className="px-3 py-3">{buyer.whaleTier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > pageSize ? (
        <div className="mt-4 flex gap-2">
          <button className="rounded border border-line px-3 py-1 text-sm text-white disabled:opacity-40" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Prev</button>
          <button className="rounded border border-line px-3 py-1 text-sm text-white disabled:opacity-40" disabled={(page + 1) * pageSize >= filtered.length} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      ) : null}
    </section>
  );
}
