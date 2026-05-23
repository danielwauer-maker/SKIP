import type { ReferralStats } from "../../types/referral";

export function ReferralStatsCard({ stats }: { stats?: ReferralStats }) {
  const items = [
    ["Total invited", stats?.invited ?? 0],
    ["Qualified", stats?.qualified ?? 0],
    ["Pending", stats?.pending ?? 0],
    ["Referral XP", stats?.xpFromReferrals ?? 0]
  ];
  return (
    <div className="glass rounded-lg p-6">
      <h2 className="text-xl font-bold text-white">Referral stats</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-md border border-line bg-black/30 p-4">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-black text-white">{Number(value).toLocaleString("en-US")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
