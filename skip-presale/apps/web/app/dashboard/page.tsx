import { UserDashboard } from "../../components/user-dashboard";
import { ContractAddressPanel } from "../../components/contract-address-panel";
import { TrustStatusPanel } from "../../components/trust-status-panel";

export default function DashboardPage() {
  return (
    <main>
      <UserDashboard />
      <TrustStatusPanel />
      <ContractAddressPanel />
    </main>
  );
}
