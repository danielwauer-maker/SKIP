import { contracts } from "../../config/contracts";
import { compactAddress, formatBpsToPercent, formatDurationDays, formatSkip } from "../../lib/format";
import type { PresaleInfo } from "../../types/admin";

export function AdminVestingPanel({
  presale,
  buyerVesting,
  totalPurchased,
  totalClaimed,
  team
}: {
  presale: PresaleInfo;
  buyerVesting: {
    start?: bigint;
    duration?: bigint;
    immediateClaimBps?: bigint;
  };
  totalPurchased: bigint;
  totalClaimed: bigint;
  team: {
    beneficiary?: string;
    startTime?: bigint;
    cliff?: bigint;
    duration?: bigint;
    released?: bigint;
    releasable?: bigint;
    allocation?: bigint;
  };
}) {
  const linearClaimBps = buyerVesting.immediateClaimBps === undefined ? undefined : 10_000n - buyerVesting.immediateClaimBps;
  const cliffEnd = team.startTime && team.cliff ? team.startTime + team.cliff : undefined;
  const vestingEnd = cliffEnd && team.duration ? cliffEnd + team.duration : undefined;
  const remainingLocked = team.allocation !== undefined && team.released !== undefined ? team.allocation - team.released : undefined;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-line bg-black/25 p-5">
        <h2 className="text-xl font-bold text-white">Buyer Vesting</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Metric label="vestingStart" value={formatDate(buyerVesting.start)} />
          <Metric label="Duration" value={formatDurationDays(buyerVesting.duration)} />
          <Metric label="Immediate claim" value={formatBpsToPercent(buyerVesting.immediateClaimBps)} />
          <Metric label="Linear claim" value={formatBpsToPercent(linearClaimBps)} />
          <Metric label="Total purchased" value={`${formatSkip(totalPurchased)} SKIP`} />
          <Metric label="Total claimed (event estimate)" value={`${formatSkip(totalClaimed)} SKIP`} />
          <Metric label="Total unclaimed" value={`${formatSkip(totalPurchased > totalClaimed ? totalPurchased - totalClaimed : 0n)} SKIP`} />
          <Metric label="claimEnabled" value={presale.claimEnabled ? "Yes" : "No"} />
          <Metric label="refundEnabled" value={presale.refundEnabled ? "Yes" : "No"} />
        </div>
      </div>
      <div className="rounded-lg border border-line bg-black/25 p-5">
        <h2 className="text-xl font-bold text-white">Team Vesting</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Metric label="Address" value={compactAddress(contracts.skipTeamVesting)} />
          <Metric label="Beneficiary" value={team.beneficiary ? compactAddress(team.beneficiary) : "not available"} />
          <Metric label="Cliff end" value={formatDate(cliffEnd)} />
          <Metric label="Vesting end" value={formatDate(vestingEnd)} />
          <Metric label="Total allocation" value={team.allocation !== undefined ? `${formatSkip(team.allocation)} SKIP` : "not available"} />
          <Metric label="Released" value={team.released !== undefined ? `${formatSkip(team.released)} SKIP` : "not available"} />
          <Metric label="Releasable now" value={team.releasable !== undefined ? `${formatSkip(team.releasable)} SKIP` : "not available"} />
          <Metric label="Remaining locked" value={remainingLocked !== undefined ? `${formatSkip(remainingLocked)} SKIP` : "not available"} />
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

function formatDate(timestamp?: bigint) {
  if (!timestamp || timestamp === 0n) return "not available";
  return new Date(Number(timestamp) * 1000).toLocaleDateString();
}
