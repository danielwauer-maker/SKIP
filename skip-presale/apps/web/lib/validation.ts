export function validateContribution(value: string, balance?: bigint) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Enter a USDC amount greater than zero.";
  if (numeric < 1) return "Minimum UI contribution is 1 USDC.";
  if (balance !== undefined && BigInt(Math.round(numeric * 1_000_000)) > balance) return "Insufficient USDC balance.";
  return null;
}
