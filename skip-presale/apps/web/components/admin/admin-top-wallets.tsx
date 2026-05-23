import { compactAddress, formatSkip, formatUsdc } from "../../lib/format";
import type { AdminKpis, BuyerAggregate } from "../../types/admin";

export function AdminTopWallets({ buyers, kpis }: { buyers: BuyerAggregate[]; kpis: AdminKpis }) {
  const byContribution = [...buyers].sort((a, b) => (a.totalContributed > b.totalContributed ? -1 : 1)).slice(0, 20);
  const byPurchased = [...buyers].sort((a, b) => (a.totalPurchased > b.totalPurchased ? -1 : 1)).slice(0, 20);
  const byTransactions = [...buyers].sort((a, b) => b.purchaseCount - a.purchaseCount).slice(0, 20);

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <WalletList title="Top by USDC" buyers={byContribution} value={(buyer) => formatUsdc(buyer.totalContributed)} />
      <WalletList title="Top by SKIP" buyers={byPurchased} value={(buyer) => formatSkip(buyer.totalPurchased)} />
      <WalletList title="Top by Tx Count" buyers={byTransactions} value={(buyer) => buyer.purchaseCount.toString()} />
      <div className="rounded-lg border border-line bg-black/25 p-5 xl:col-span-3">
        <h3 className="text-lg font-bold text-white">Concentration Metrics</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Metric label="Top 1 share" value={`${kpis.top1Share.toFixed(2)}%`} />
          <Metric label="Top 5 share" value={`${kpis.top5Share.toFixed(2)}%`} />
          <Metric label="Top 10 share" value={`${kpis.top10Share.toFixed(2)}%`} />
          <Metric label="Gini approx." value={kpis.concentrationScore.toString()} />
        </div>
      </div>
    </section>
  );
}

function WalletList({ title, buyers, value }: { title: string; buyers: BuyerAggregate[]; value: (buyer: BuyerAggregate) => string }) {
  return (
    <div className="rounded-lg border border-line bg-black/25 p-5">
      <h3 className="font-bold text-white">{title}</h3>
      <div className="mt-4 grid gap-2 text-sm">
        {buyers.length ? buyers.map((buyer) => (
          <div key={`${title}-${buyer.wallet}`} className="flex items-center justify-between gap-3 rounded border border-line bg-black/20 p-3">
            <span className="text-neon">{compactAddress(buyer.wallet)}</span>
            <span className="text-slate-300">{value(buyer)}</span>
          </div>
        )) : <div className="text-slate-500">No event data loaded.</div>}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-black/20 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-white">{value}</div>
    </div>
  );
}
