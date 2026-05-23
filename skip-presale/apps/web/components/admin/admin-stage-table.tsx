import { downloadCsv } from "../../lib/csv";
import { formatSkip, formatUsdc } from "../../lib/format";
import type { StageAggregate } from "../../types/admin";

export function AdminStageTable({ stages }: { stages: StageAggregate[] }) {
  return (
    <section className="rounded-lg border border-line bg-black/25 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Stage Analytics</h2>
          <p className="mt-1 text-sm text-slate-400">Stage status is exact on-chain. Buyer counts are reconstructed from purchase events.</p>
        </div>
        <button
          className="rounded-md border border-line px-3 py-2 text-sm text-white hover:border-neon"
          onClick={() =>
            downloadCsv(
              "skip-stage-analytics.csv",
              stages.map((stage) => ({
                stage: stage.stageNumber,
                priceUsdc: Number(stage.priceUsdc) / 1_000_000,
                tokenCap: formatSkip(stage.tokenCap),
                tokensSold: formatSkip(stage.sold),
                tokensRemaining: formatSkip(stage.tokensRemaining),
                stageRaisedUsdc: formatUsdc(stage.stageRaised),
                stageTargetUsdc: formatUsdc(stage.stageRaiseTarget),
                progress: stage.progress,
                buyers: stage.buyers,
                transactions: stage.transactions,
                averageBuyUsdc: formatUsdc(stage.averageBuy),
                largestBuyUsdc: formatUsdc(stage.largestBuy),
                completed: stage.isCompleted ? "yes" : "no",
                developmentUnlockUsdc: formatUsdc(stage.developmentUnlock)
              }))
            )
          }
        >
          Export CSV
        </button>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[1200px] w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              {["Stage", "Price", "Cap", "Sold", "Remaining", "Raised", "Target", "Progress", "Buyers", "Tx", "Avg", "Largest", "Done", "Dev Unlock"].map((head) => (
                <th key={head} className="border-b border-line px-3 py-2">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stages.map((stage) => (
              <tr key={stage.stageNumber} className="border-b border-line/60 text-slate-300">
                <td className="px-3 py-3 text-white">{stage.stageNumber}</td>
                <td className="px-3 py-3">{(Number(stage.priceUsdc) / 1_000_000).toFixed(6)}</td>
                <td className="px-3 py-3">{formatSkip(stage.tokenCap)}</td>
                <td className="px-3 py-3">{formatSkip(stage.sold)}</td>
                <td className="px-3 py-3">{formatSkip(stage.tokensRemaining)}</td>
                <td className="px-3 py-3">{formatUsdc(stage.stageRaised)}</td>
                <td className="px-3 py-3">{formatUsdc(stage.stageRaiseTarget)}</td>
                <td className="px-3 py-3">
                  <div className="h-2 w-28 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-neon" style={{ width: `${stage.progress}%` }} />
                  </div>
                  <span className="text-xs">{stage.progress.toFixed(1)}%</span>
                </td>
                <td className="px-3 py-3">{stage.buyers}</td>
                <td className="px-3 py-3">{stage.transactions}</td>
                <td className="px-3 py-3">{formatUsdc(stage.averageBuy)}</td>
                <td className="px-3 py-3">{formatUsdc(stage.largestBuy)}</td>
                <td className="px-3 py-3">{stage.isCompleted ? "Yes" : "No"}</td>
                <td className="px-3 py-3">{formatUsdc(stage.developmentUnlock)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
