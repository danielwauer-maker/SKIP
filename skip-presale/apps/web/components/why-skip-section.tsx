import { Clock, Construction, Map, Navigation, Siren, UsersRound } from "lucide-react";

const problems = [
  ["Waiting in queues", Clock],
  ["Traffic", Navigation],
  ["Overcrowded places", UsersRound],
  ["Broken systems", Construction],
  ["Wasted life in delays", Siren]
];

const vision = ["Avoid waiting times", "See live crowd signals", "Make better timing decisions", "Use time more efficiently"];

export function WhySkipSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-4xl font-black text-white">Time is the real currency.</h2>
          <div className="mt-8 grid gap-3">
            {problems.map(([label, Icon]) => (
              <div key={label as string} className="flex items-center gap-3 rounded-md border border-line bg-black/30 p-4">
                <Icon className="text-neon" size={20} />
                <span className="font-semibold text-white">{label as string}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white">Future wait-time ecosystem vision</h3>
          <p className="mt-3 text-slate-300">
            A later community app is intended to help people understand busy/quiet signals through reports, check-ins and
            crowd observations. This is planned utility and not guaranteed future functionality.
          </p>
          <div className="mt-6 grid gap-3">
            {vision.map((item) => (
              <div key={item} className="rounded-md border border-line bg-black/30 p-4 text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
