import { Hero } from "../components/hero";
import { PresaleCard } from "../components/presale-card";
import { SecuritySection } from "../components/security-section";
import { TokenomicsSection } from "../components/tokenomics-section";
import { TransparencySection } from "../components/transparency-section";
import { TrustSection } from "../components/trust-section";
import { WhySkipSection } from "../components/why-skip-section";
import { RoadmapSection } from "../components/roadmap-section";
import { FaqSection } from "../components/faq-section";

export default function Home() {
  return (
    <main>
      <Hero />
      <PresaleCard />
      <WhySkipSection />
      <TrustSection />
      <SecuritySection />
      <TransparencySection />
      <TokenomicsSection />
      <RoadmapSection />
      <FaqSection />
    </main>
  );
}
