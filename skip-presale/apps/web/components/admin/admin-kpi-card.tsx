export function AdminKpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-black/30 p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 break-words text-2xl font-bold text-white">{value}</div>
      {hint ? <div className="mt-2 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}
