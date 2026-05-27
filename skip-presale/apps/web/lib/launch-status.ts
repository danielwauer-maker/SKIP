export type LaunchStatusTone = "ok" | "warn";
export type LaunchStatusIcon = "check" | "audit" | "shield" | "warning";

export const launchStatusItems = [
  {
    label: "Contract test coverage",
    status: "Current internal suite passing",
    tone: "ok",
    icon: "check"
  },
  {
    label: "External audit",
    status: "Not completed yet",
    tone: "warn",
    icon: "audit"
  },
  {
    label: "Multisig ownership",
    status: "Required before mainnet",
    tone: "warn",
    icon: "shield"
  },
  {
    label: "Mainnet deployment",
    status: "Blocked until human approval",
    tone: "warn",
    icon: "warning"
  }
] as const satisfies ReadonlyArray<{
  label: string;
  status: string;
  tone: LaunchStatusTone;
  icon: LaunchStatusIcon;
}>;

export const mainnetBlockers = [
  "External smart contract audit",
  "Owner multisig or timelock",
  "Legal and eligibility review",
  "PostgreSQL production database",
  "Monitoring and alerting"
] as const;

export const trustStatusSummary =
  "The project is being prepared for public testnet first. Mainnet remains blocked until audit, legal review and multisig ownership are complete.";
