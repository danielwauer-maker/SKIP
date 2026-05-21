const phases = [
  "Presale MVP",
  "Community Growth",
  "Wait-Time Map MVP",
  "Rewards System",
  "Partner Spots",
  "Mobile App"
];

export function RoadmapSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-4xl font-black text-white">Roadmap</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {phases.map((phase, index) => (
          <div key={phase} className="rounded-lg border border-line bg-black/30 p-6">
            <div className="text-sm text-neon">Phase {index + 1}</div>
            <div className="mt-2 text-xl font-bold text-white">{phase}</div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Planned direction only. Future utility, releases, partners and timelines are not guaranteed.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
