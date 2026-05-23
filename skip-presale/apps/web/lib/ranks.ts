import type { RankInfo } from "../types/referral";

export const ranks: RankInfo[] = [
  { name: "Visitor", minXp: 0, badgeClass: "border-slate-500/40 bg-slate-500/10 text-slate-200" },
  { name: "Starter", minXp: 100, badgeClass: "border-neon/40 bg-neon/10 text-neon" },
  { name: "Scout", minXp: 500, badgeClass: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" },
  { name: "Builder", minXp: 1500, badgeClass: "border-lime-300/40 bg-lime-300/10 text-lime-100" },
  { name: "Founder", minXp: 5000, badgeClass: "border-amber-300/40 bg-amber-300/10 text-amber-100" },
  { name: "Genesis Founder", minXp: 10000, badgeClass: "border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-100" },
  { name: "Vanguard", minXp: 25000, badgeClass: "border-white/50 bg-white/10 text-white" }
];

export function rankForXp(xp: number) {
  return [...ranks].reverse().find((rank) => xp >= rank.minXp) ?? ranks[0];
}

export function nextRankForXp(xp: number) {
  return ranks.find((rank) => rank.minXp > xp);
}

export function rankProgress(xp: number) {
  const current = rankForXp(xp);
  const next = nextRankForXp(xp);
  if (!next) return { current, next: null, xpToNext: 0, progress: 100 };
  const span = next.minXp - current.minXp;
  const earned = xp - current.minXp;
  return {
    current,
    next,
    xpToNext: Math.max(0, next.minXp - xp),
    progress: Math.max(0, Math.min(100, (earned / span) * 100))
  };
}

export function isFounderRank(rank: string) {
  return ["Founder", "Genesis Founder", "Vanguard"].includes(rank);
}
