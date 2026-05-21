import { formatUnits, parseUnits } from "viem";

export function formatUsdc(value?: bigint, maxFractionDigits = 2) {
  if (value === undefined) return "0";
  return Number(formatUnits(value, 6)).toLocaleString("en-US", { maximumFractionDigits: maxFractionDigits });
}

export function formatSkip(value?: bigint, maxFractionDigits = 0) {
  if (value === undefined) return "0";
  return Number(formatUnits(value, 18)).toLocaleString("en-US", { maximumFractionDigits: maxFractionDigits });
}

export function parseUsdc(value: string) {
  if (!value || Number(value) <= 0) return BigInt(0);
  return parseUnits(value, 6);
}

export function compactAddress(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function percent(numerator?: bigint, denominator?: bigint) {
  if (!numerator || !denominator || denominator === BigInt(0)) return 0;
  return Math.min(100, Number((numerator * BigInt(10000)) / denominator) / 100);
}
