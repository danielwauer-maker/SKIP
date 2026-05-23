export function XpProgressCard({
  xpTotal,
  rank
}: {
  xpTotal: number;
  rank?: { current: { name: string }; next: { name: string; minXp: number } | null; xpToNext: number; progress: number };
}) {
  return (
    <div className="glass rounded-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">XP total</div>
          <div className="mt-1 text-4xl font-black text-white">{xpTotal.toLocaleString("en-US")}</div>
        </div>
        <div className="rounded-md border border-neon/30 bg-neon/10 px-3 py-2 text-sm font-semibold text-neon">{rank?.current.name || "Visitor"}</div>
      </div>
      <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-neon" style={{ width: `${rank?.progress ?? 0}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-sm text-slate-400">
        <span>{rank?.current.name || "Visitor"}</span>
        <span>{rank?.next ? `${rank.xpToNext.toLocaleString("en-US")} XP to ${rank.next.name}` : "Top rank reached"}</span>
      </div>
    </div>
  );
}
