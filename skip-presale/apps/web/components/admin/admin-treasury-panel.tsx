import { formatUsdc } from "../../lib/format";
import type { PresaleInfo } from "../../types/admin";

export function AdminTreasuryPanel({
  presale,
  contractUsdcBalance,
  allStagesSoldOut
}: {
  presale: PresaleInfo;
  contractUsdcBalance?: bigint;
  allStagesSoldOut?: boolean;
}) {
  const lockedFunds = presale.totalRaised > presale.developmentWithdrawn ? presale.totalRaised - presale.developmentWithdrawn : 0n;
  const refundCoverage = presale.totalRaised > 0n && contractUsdcBalance !== undefined ? Number((contractUsdcBalance * 10_000n) / presale.totalRaised) / 100 : 0;

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-lg border border-line bg-black/25 p-5 lg:col-span-2">
        <h2 className="text-xl font-bold text-white">Treasury Control / Analytics</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Metric label="Total Raised" value={`${formatUsdc(presale.totalRaised)} USDC`} />
          <Metric label="Completed Stage Raised" value={`${formatUsdc(presale.completedStageRaised)} USDC`} />
          <Metric label="Development Withdrawn" value={`${formatUsdc(presale.developmentWithdrawn)} USDC`} />
          <Metric label="Max Dev Withdrawable" value={`${formatUsdc(presale.maxDevelopmentWithdrawable)} USDC`} />
          <Metric label="Locked Funds" value={`${formatUsdc(lockedFunds)} USDC`} />
          <Metric label="Contract USDC Balance" value={`${formatUsdc(contractUsdcBalance)} USDC`} />
          <Metric label="Refund Exposure" value={`${formatUsdc(presale.totalRaised)} USDC`} />
          <Metric label="Refund Coverage" value={`${refundCoverage.toFixed(2)}%`} />
          <Metric label="Softcap" value={`${formatUsdc(presale.softCap)} USDC`} />
          <Metric label="Softcap reached" value={presale.totalRaised >= presale.softCap ? "Yes" : "No"} />
          <Metric label="Hardcap reached" value={presale.totalRaised >= presale.hardCap ? "Yes" : "No"} />
          <Metric label="All stages sold out" value={allStagesSoldOut ? "Yes" : "No"} />
        </div>
      </div>
      <div className="rounded-lg border border-line bg-black/25 p-5">
        <h3 className="font-bold text-white">Warnings</h3>
        <div className="mt-4 grid gap-3 text-sm">
          {contractUsdcBalance !== undefined && contractUsdcBalance < presale.totalRaised && !presale.claimEnabled ? (
            <Warning text="Contract USDC balance is below totalRaised. Refunds may require repayment before activation." />
          ) : null}
          {presale.developmentWithdrawn > 0n ? <Warning text="Development funds withdrawn. Softcap failure path depends on repayDevelopmentFunds coverage." /> : null}
          {presale.maxDevelopmentWithdrawable > 0n ? <Warning text="Completed stages currently allow additional development withdrawal." /> : null}
          {presale.developmentWithdrawn === 0n && presale.maxDevelopmentWithdrawable === 0n ? <div className="text-slate-500">No treasury warnings from current data.</div> : null}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-black/20 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-white">{value}</div>
    </div>
  );
}

function Warning({ text }: { text: string }) {
  return <div className="rounded border border-amber-400/30 bg-amber-400/10 p-3 text-amber-100">{text}</div>;
}
