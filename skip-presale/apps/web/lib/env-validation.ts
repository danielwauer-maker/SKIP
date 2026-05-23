import { targetChainId } from "../config/chains";
import { contracts, hasConfiguredContracts } from "../config/contracts";

const zeroAddress = "0x0000000000000000000000000000000000000000";
const dummyWalletConnectProjectId = "00000000000000000000000000000000";

export function getPublicEnvWarnings(context: "presale" | "admin" = "presale") {
  const warnings: string[] = [];
  const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  const adminEnabled = process.env.NEXT_PUBLIC_ENABLE_ADMIN === "true";
  const referralsEnabled = process.env.NEXT_PUBLIC_ENABLE_REFERRALS !== "false";

  if (!process.env.NEXT_PUBLIC_CHAIN_ID) warnings.push("NEXT_PUBLIC_CHAIN_ID is not set; the app will fall back to Hardhat Local.");
  if (!hasConfiguredContracts()) warnings.push("One or more contract addresses are missing.");
  if (targetChainId !== 31337 && (!walletConnectProjectId || walletConnectProjectId === dummyWalletConnectProjectId)) {
    warnings.push("WalletConnect Project ID is missing or still using the dummy value for a non-local chain.");
  }
  if (targetChainId === 137 && contracts.usdc === zeroAddress) warnings.push("Mainnet USDC address is not configured.");
  if (targetChainId === 137 && adminEnabled) warnings.push("Admin is enabled on a mainnet target; frontend guard is not real authentication.");
  if (context === "admin" && adminEnabled) warnings.push("Admin dashboard uses a frontend guard only. Add real auth before public deployment.");
  if (!referralsEnabled) warnings.push("Referrals are disabled through NEXT_PUBLIC_ENABLE_REFERRALS=false.");

  return warnings;
}

export function getDbMode() {
  const databaseUrl = process.env.DATABASE_URL || "";
  if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) return "PostgreSQL";
  if (databaseUrl.startsWith("file:")) return "SQLite";
  return "Not configured";
}

export function getServerSecurityStatus() {
  const warnings = getPublicEnvWarnings("admin");
  const databaseUrl = process.env.DATABASE_URL || "";
  const adminEnabled = process.env.NEXT_PUBLIC_ENABLE_ADMIN === "true";
  const isProduction = process.env.NODE_ENV === "production";

  if (adminEnabled && !process.env.ADMIN_PASSWORD) warnings.push("ADMIN_PASSWORD is missing while admin is enabled.");
  if (adminEnabled && !process.env.ADMIN_SESSION_SECRET) warnings.push("ADMIN_SESSION_SECRET is missing while admin is enabled.");
  if (!databaseUrl) warnings.push("DATABASE_URL is missing.");
  if (isProduction && databaseUrl.startsWith("file:")) warnings.push("Production is configured with SQLite. Use PostgreSQL for public deployments.");
  if (targetChainId === 137 && contracts.usdc === zeroAddress) warnings.push("Mainnet target has no USDC address configured.");
  if (targetChainId === 137 && contracts.usdc.toLowerCase().includes("mock")) warnings.push("Mainnet appears to use a mock USDC value.");

  return {
    authenticated: true,
    chainId: targetChainId,
    dbMode: getDbMode(),
    adminSession: true,
    warnings,
    publicTestnetChecklist: [
      { label: "Admin password configured", ok: Boolean(process.env.ADMIN_PASSWORD) },
      { label: "Admin session secret configured", ok: Boolean(process.env.ADMIN_SESSION_SECRET) },
      { label: "Database configured", ok: Boolean(databaseUrl) },
      { label: "Contract addresses configured", ok: hasConfiguredContracts() },
      { label: "WalletConnect configured for non-local chain", ok: targetChainId === 31337 || Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) }
    ],
    mainnetBlockers: [
      "External smart contract audit",
      "Owner multisig or timelock",
      "Legal and eligibility review",
      "PostgreSQL production database",
      "Monitoring and alerting"
    ]
  };
}
