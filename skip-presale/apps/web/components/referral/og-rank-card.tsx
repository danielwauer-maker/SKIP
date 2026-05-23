export function OgRankCard({ rank, isOgFounder }: { rank: string; isOgFounder: boolean }) {
  return (
    <div className="glass rounded-lg p-6">
      <div className="text-sm uppercase tracking-[0.2em] text-neon">Founder Status</div>
      <h2 className="mt-3 text-3xl font-black text-white">{isOgFounder ? "OG Founder" : rank}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Founder status reflects ecosystem reputation in the testnet community. It is not a financial claim and does not guarantee future allocations.
      </p>
    </div>
  );
}
