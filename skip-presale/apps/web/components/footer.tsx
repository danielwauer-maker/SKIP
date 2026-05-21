import Link from "next/link";

const links = [
  ["/disclaimer", "Disclaimer"],
  ["/whitepaper", "Whitepaper"],
  ["/tokenomics", "Tokenomics"],
  ["/roadmap", "Roadmap"],
  ["/faq", "FAQ"]
];

export function Footer() {
  return (
    <footer className="border-t border-line px-4 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>$SKIP is an experimental Web3 community project. No guarantees. High risk.</p>
        <div className="flex flex-wrap gap-4">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-neon">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
