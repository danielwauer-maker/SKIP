import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Web3Provider } from "../lib/wagmi";
import { RiskBanner } from "../components/risk-banner";
import { Footer } from "../components/footer";
import { WalletConnectButton } from "../components/wallet-connect-button";

export const metadata: Metadata = {
  metadataBase: new URL("https://skip.community"),
  title: "$SKIP — Stop wasting time.",
  description:
    "A transparency-focused crypto project and experimental Web3 community token with planned wait-time ecosystem utility.",
  keywords: [
    "community token",
    "transparency-focused crypto project",
    "utility-focused meme token",
    "experimental Web3 community project",
    "future wait-time ecosystem vision"
  ],
  openGraph: {
    title: "$SKIP — Stop wasting time.",
    description: "Experimental community token with transparent presale architecture and planned app utility.",
    images: ["/og-image.png"]
  }
};

const nav = [
  ["/presale", "Presale"],
  ["/dashboard", "Dashboard"],
  ["/referrals", "Referrals"],
  ["/tokenomics", "Tokenomics"],
  ["/roadmap", "Roadmap"],
  ["/faq", "FAQ"]
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <RiskBanner />
          <header className="sticky top-0 z-40 border-b border-line bg-ink/80 px-4 py-4 backdrop-blur">
            <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <Link href="/" className="text-xl font-black text-white">
                <span className="text-neon">$</span>SKIP
              </Link>
              <div className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
                {nav.map(([href, label]) => (
                  <Link key={href} href={href} className="hover:text-neon">
                    {label}
                  </Link>
                ))}
              </div>
              <div className="hidden sm:block">
                <WalletConnectButton />
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
