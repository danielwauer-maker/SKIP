import { Copy } from "lucide-react";
import { targetChain } from "../../config/chains";
import { downloadCsv } from "../../lib/csv";
import { compactAddress, formatSkip, formatUsdc } from "../../lib/format";
import type { PurchaseEvent, StageAllocation } from "../../types/admin";

export function AdminRecentTransactions({ events, allocations }: { events: PurchaseEvent[]; allocations: StageAllocation[] }) {
  const recent = [...events].reverse().slice(0, 50);
  const explorer = "blockExplorers" in targetChain ? targetChain.blockExplorers?.default.url : undefined;

  return (
    <section className="rounded-lg border border-line bg-black/25 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
        <button
          className="rounded-md border border-line px-3 py-2 text-sm text-white hover:border-neon"
          onClick={() =>
            downloadCsv(
              "skip-transactions.csv",
              events.map((event) => {
                const allocation = allocations.find((item) => item.txHash === event.txHash);
                return {
                  block: event.blockNumber,
                  txHash: event.txHash,
                  wallet: event.buyer,
                  usdcAmount: formatUsdc(event.usdcAmount),
                  skipAmount: formatSkip(event.skipAmount),
                  estimatedStage: allocation?.stageNumber,
                  effectivePrice: event.skipAmount > 0n ? Number(event.usdcAmount) / Number(event.skipAmount / 10n ** 12n) : 0
                };
              })
            )
          }
        >
          Export CSV
        </button>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[1000px] w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              {["Block", "Tx", "Wallet", "USDC", "SKIP", "Stage est.", "Effective price", "Copy"].map((head) => (
                <th key={head} className="border-b border-line px-3 py-2">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((event) => {
              const allocation = allocations.find((item) => item.txHash === event.txHash);
              const effectivePrice = event.skipAmount > 0n ? Number(event.usdcAmount) / Number(event.skipAmount / 10n ** 12n) : 0;
              return (
                <tr key={event.id} className="border-b border-line/60 text-slate-300">
                  <td className="px-3 py-3">{event.blockNumber.toString()}</td>
                  <td className="px-3 py-3 text-neon">
                    {explorer ? <a href={`${explorer}/tx/${event.txHash}`} target="_blank">{shortHash(event.txHash)}</a> : shortHash(event.txHash)}
                  </td>
                  <td className="px-3 py-3">{compactAddress(event.buyer)}</td>
                  <td className="px-3 py-3">{formatUsdc(event.usdcAmount)}</td>
                  <td className="px-3 py-3">{formatSkip(event.skipAmount)}</td>
                  <td className="px-3 py-3">{allocation?.stageNumber ?? "n/a"}*</td>
                  <td className="px-3 py-3">{effectivePrice.toFixed(8)}</td>
                  <td className="px-3 py-3">
                    <button className="rounded border border-line p-2 hover:border-neon" onClick={() => navigator.clipboard.writeText(event.txHash)}>
                      <Copy size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">* Stage is reconstructed from event order and stage pricing. Add stageBreakdown to contract events for exact multi-stage attribution.</p>
    </section>
  );
}

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}
