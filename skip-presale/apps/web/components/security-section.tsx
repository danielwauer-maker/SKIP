import { AlertOctagon, Banknote, CirclePause, FileCheck2, Gauge, Lock, Shield, ShieldAlert } from "lucide-react";

const controls = [
  ["OpenZeppelin Contracts", Shield],
  ["Reentrancy Protection", Lock],
  ["Pausable emergency mechanism", CirclePause],
  ["Transparent treasury logic", Banknote],
  ["Hardcap protection", Gauge],
  ["Softcap refund logic", ShieldAlert],
  ["Planned contract verification", FileCheck2],
  ["Planned audit readiness", AlertOctagon]
];

export function SecuritySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="rounded-lg border border-line bg-[#07100f] p-6 sm:p-8">
        <h2 className="text-4xl font-black text-white">Security-Focused Infrastructure</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {controls.map(([label, Icon]) => (
            <div key={label as string} className="rounded-md border border-line bg-black/30 p-5">
              <Icon className="text-neon" size={22} />
              <div className="mt-3 text-sm font-semibold text-white">{label as string}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
