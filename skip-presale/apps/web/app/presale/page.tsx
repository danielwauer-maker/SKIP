import { PresaleCard } from "../../components/presale-card";
import { TransparencySection } from "../../components/transparency-section";
import { ContractAddressPanel } from "../../components/contract-address-panel";
import { TrustStatusPanel } from "../../components/trust-status-panel";

export default function PresalePage() {
  return (
    <main className="py-8">
      <PresaleCard />
      <TrustStatusPanel />
      <ContractAddressPanel />
      <TransparencySection />
    </main>
  );
}
