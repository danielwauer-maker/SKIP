import { targetChain } from "../../config/chains";
import { contracts, hasConfiguredContracts } from "../../config/contracts";
import { compactAddress, formatSkip } from "../../lib/format";
import type { PresaleInfo } from "../../types/admin";

export function AdminRiskPanel({
  presale,
  alerts,
  paused,
  owner,
  totalSupply,
  presaleTokenBalance
}: {
  presale: PresaleInfo;
  alerts: string[];
  paused?: boolean;
  owner?: string;
  totalSupply?: bigint;
  presaleTokenBalance?: bigint;
}) {
  const sufficientForClaims = presaleTokenBalance !== undefined ? presaleTokenBalance >= presale.totalSold : undefined;

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
      <div className="rounded-lg border border-line bg-black/25 p-5">
        <h2 className="text-xl font-bold text-white">Risk / Security Monitor</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Metric label="Contract paused" value={paused === undefined ? "n/a" : paused ? "Yes" : "No"} />
          <Metric label="Finalized" value={presale.finalized ? "Yes" : "No"} />
          <Metric label="Claim enabled" value={presale.claimEnabled ? "Yes" : "No"} />
          <Metric label="Refund enabled" value={presale.refundEnabled ? "Yes" : "No"} />
          <Metric label="Current chain" value={targetChain.name} />
          <Metric label="Target chain" value={targetChain.name} />
          <Metric label="Contracts configured" value={hasConfiguredContracts() ? "Yes" : "No"} />
          <Metric label="ABI loaded" value="Yes" />
          <Metric label="Owner" value={owner ? compactAddress(owner) : "not available"} />
          <Metric label="Token total supply" value={totalSupply !== undefined ? `${formatSkip(totalSupply)} SKIP` : "not available"} />
          <Metric label="Presale token balance" value={presaleTokenBalance !== undefined ? `${formatSkip(presaleTokenBalance)} SKIP` : "not available"} />
          <Metric label="Sufficient for claims" value={sufficientForClaims === undefined ? "n/a" : sufficientForClaims ? "Yes" : "No"} />
          <Metric label="Presale address" value={compactAddress(contracts.skipPresale)} />
          <Metric label="Token address" value={compactAddress(contracts.skipToken)} />
          <Metric label="USDC address" value={compactAddress(contracts.usdc)} />
        </div>
      </div>
      <div className="rounded-lg border border-line bg-black/25 p-5">
        <h3 className="font-bold text-white">Heuristic Alerts</h3>
        <div className="mt-4 grid gap-3 text-sm">
          {alerts.length ? alerts.map((alert) => (
            <div key={alert} className="rounded border border-amber-400/30 bg-amber-400/10 p-3 text-amber-100">
              {alert}
            </div>
          )) : <div className="text-slate-500">No possible suspicious patterns from loaded event data.</div>}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-black/20 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 break-words font-semibold text-white">{value}</div>
    </div>
  );
}
