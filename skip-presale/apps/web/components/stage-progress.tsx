export function StageProgress({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span>{clamped.toFixed(1)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-line bg-black/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-neon to-acid shadow-glow transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
