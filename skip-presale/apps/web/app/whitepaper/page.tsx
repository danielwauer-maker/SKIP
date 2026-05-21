import Link from "next/link";

export default function WhitepaperPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-black text-white">$SKIP Lite Whitepaper</h1>
      <div className="mt-8 space-y-5 leading-8 text-slate-300">
        <p>
          $SKIP is an experimental community token around the global problem of wasted time: queues, traffic, waiting
          rooms, overcrowded places and slow systems.
        </p>
        <p>
          The intended ecosystem direction is a future wait-time app with community reports, check-ins and busy/quiet
          indicators. This is planned utility and may never be delivered.
        </p>
        <p>
          The presale contract uses fixed caps, staged pricing, buyer vesting, refund logic when the softcap is not
          reached, and stage-based development treasury rules.
        </p>
        <Link className="inline-flex rounded-md bg-neon px-5 py-3 font-semibold text-ink" href="/presale">
          Open Presale
        </Link>
      </div>
    </main>
  );
}
