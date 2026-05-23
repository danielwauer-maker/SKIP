import { createHash } from "crypto";
import { NextRequest } from "next/server";

export function hashValue(value?: string | null) {
  if (!value) return undefined;
  return createHash("sha256").update(value).digest("hex");
}

export function requestHashes(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");
  return {
    ipHash: hashValue(ip),
    userAgentHash: hashValue(userAgent)
  };
}

export function normalizeWallet(walletAddress: string) {
  return walletAddress.trim().toLowerCase();
}

export function isValidWallet(walletAddress: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim());
}

export function rateLimitEnabled() {
  return process.env.REFERRAL_RATE_LIMIT_ENABLED === "true";
}

export function suspiciousFlags(input: {
  signupsLastDay: number;
  sameUserAgentClicks: number;
  referredCount: number;
  qualifiedCount: number;
}) {
  const flags: string[] = [];
  if (input.signupsLastDay >= 20) flags.push("many recent signups");
  if (input.sameUserAgentClicks >= 20) flags.push("many clicks with same user agent");
  if (input.referredCount >= 10 && input.qualifiedCount === 0) flags.push("many referrals without qualification");
  if (input.referredCount >= 20 && input.qualifiedCount / input.referredCount < 0.1) flags.push("low qualification rate");
  return flags;
}
