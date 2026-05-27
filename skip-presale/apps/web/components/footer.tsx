import Link from "next/link";

export function Footer() {
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "#";
  const xUrl = process.env.NEXT_PUBLIC_X_URL || "#";
  const contactEmail = "contact@skip.community";

  return (
    <footer className="border-t border-line px-4 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-2xl text-neutral-400">
          SKIP is an early-stage project. Nothing on this website is financial advice. Always do your own research.
        </p>
        <div className="flex flex-wrap gap-4">
          <a href={discordUrl} className="hover:text-acid">
            Discord
          </a>
          <a href={xUrl} className="hover:text-acid">
            X/Twitter
          </a>
          <Link href="/#waitlist" className="font-semibold text-acid hover:text-neon">
            Join Waitlist
          </Link>
          <a href={`mailto:${contactEmail}`} className="hover:text-neon">
            Contact
          </a>
          <Link href="/disclaimer" className="hover:text-acid">
            Disclaimer
          </Link>
        </div>
      </div>
    </footer>
  );
}
