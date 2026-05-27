import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { Web3Provider } from "../lib/wagmi";
import { Footer } from "../components/footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://skip.community"),
  title: "SKIP \u2014 Stop Wasting Your Life Waiting",
  description:
    "SKIP is building a community-driven real-world activity intelligence ecosystem to help people make smarter everyday decisions.",
  keywords: [
    "SKIP",
    "real-world activity intelligence",
    "community-driven ecosystem",
    "wait-time intelligence",
    "transparent Web3 community"
  ],
  openGraph: {
    title: "SKIP \u2014 Stop Wasting Your Life Waiting",
    description:
      "SKIP is building a community-driven real-world activity intelligence ecosystem to help people make smarter everyday decisions.",
    images: ["/og-image.png"]
  }
};

const nav = [
  ["/#vision", "Vision"],
  ["/#community", "Community"],
  ["/roadmap", "Roadmap"],
  ["/#faq", "FAQ"]
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "/#waitlist";

  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <header className="sticky top-0 z-40 border-b border-line bg-ink/80 px-4 py-4 backdrop-blur">
            <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3 text-xl font-black text-white">
                <Image
                  src="/skip-icon.png"
                  alt="SKIP logo"
                  width={38}
                  height={38}
                  className="rounded-full shadow-glow"
                  priority
                />
                <span>SKIP</span>
              </Link>
              <div className="flex items-center gap-4">
                <div className="hidden items-center gap-5 text-sm text-neutral-300 md:flex">
                  {nav.map(([href, label]) => (
                    <Link key={href} href={href} className="transition hover:text-neon">
                      {label}
                    </Link>
                  ))}
                </div>
                <a
                  href={discordUrl}
                  className="focus-ring hidden rounded-md border border-neon/45 bg-neon/10 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-neon hover:text-ink sm:inline-flex"
                >
                  Join Discord
                </a>
              </div>
            </nav>
          </header>
          {children}
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
