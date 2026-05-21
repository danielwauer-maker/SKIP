import { BadgeCheck, Coins, LockKeyhole, RefreshCcw, ShieldCheck, Users, Workflow } from "lucide-react";

const items = [
  ["Fixed token supply", Coins],
  ["No hidden minting", BadgeCheck],
  ["Refund protection", RefreshCcw],
  ["Transparent development treasury", LockKeyhole],
  ["Community-first architecture", Users],
  ["Long-term project vision", Workflow],
  ["Security-focused smart contracts", ShieldCheck]
];

export function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 max-w-3xl">
        <h2 className="text-4xl font-black text-white">Trust by Architecture</h2>
        <p className="mt-3 text-slate-300">
          Built with European transparency standards in mind: structured treasury protections, clear caps and public
          on-chain accounting.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map(([label, Icon]) => (
          <div key={label as string} className="glass rounded-lg p-5">
            <Icon className="text-neon" size={24} />
            <div className="mt-4 font-semibold text-white">{label as string}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
