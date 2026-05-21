import { tokenomics, totalSupply } from "../config/presale";

export function TokenomicsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 max-w-3xl">
        <h2 className="text-4xl font-black text-white">Tokenomics</h2>
        <p className="mt-3 text-slate-300">Fixed supply. No hidden minting. No transfer tax. No honeypot mechanics.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-lg p-6 md:col-span-2">
          <div className="text-sm text-slate-400">Total Supply</div>
          <div className="mt-2 text-3xl font-black text-neon">{totalSupply.toLocaleString()} SKIP</div>
        </div>
        {tokenomics.map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-black/30 p-6">
            <div className="text-3xl font-black text-white">{item.value}%</div>
            <div className="mt-2 text-sm text-slate-300">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
