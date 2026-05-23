import { createPublicClient, http, type Address } from "viem";
import { abis, contracts, hasConfiguredContracts } from "../config/contracts";
import { targetChain } from "../config/chains";
import { prisma } from "./prisma";
import { normalizeWallet, suspiciousFlags } from "./anti-abuse";
import { actionKey, awardXp } from "./xp";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const defaultQuests = [
  { key: "REGISTER_WALLET", title: "Register wallet", description: "Join the SKIP early community with your wallet.", points: 100, requiresVerification: false },
  { key: "CONNECT_WALLET_DAILY", title: "Daily check-in", description: "Connect and keep your community profile active.", points: 25, requiresVerification: false },
  { key: "COMPLETE_TESTNET_BUY", title: "Complete testnet buy", description: "Test the presale flow on the configured testnet.", points: 250, requiresVerification: true },
  { key: "INVITE_1_FRIEND", title: "Invite 1 friend", description: "Have one referral register through your link.", points: 150, requiresVerification: true },
  { key: "INVITE_5_FRIENDS", title: "Invite 5 friends", description: "Bring five wallets into the early community.", points: 400, requiresVerification: true },
  { key: "FEEDBACK_SUBMITTED", title: "Submit feedback", description: "Share useful product feedback for the testnet.", points: 150, requiresVerification: false },
  { key: "BUG_REPORT", title: "Report a bug", description: "Manual review for useful bug reports.", points: 300, requiresVerification: true },
  { key: "JOIN_COMMUNITY", title: "Join community", description: "Community-role verification placeholder.", points: 100, requiresVerification: true },
  { key: "SHARE_SKIP", title: "Share SKIP", description: "Share the testnet campaign with clear risk language.", points: 100, requiresVerification: true }
] as const;

export async function seedQuests() {
  await Promise.all(
    defaultQuests.map((quest) =>
      prisma.quest.upsert({
        where: { key: quest.key },
        update: {
          title: quest.title,
          description: quest.description,
          points: quest.points,
          requiresVerification: quest.requiresVerification,
          isActive: true
        },
        create: { ...quest, maxCompletionsPerUser: 1, isActive: true }
      })
    )
  );
}

export async function generateReferralCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    const code = `SKIP-${suffix}`;
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique referral code.");
}

export function referralUrl(code: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/referrals?ref=${encodeURIComponent(code)}`;
}

export async function registerWallet(walletAddress: string, referralCodeFromUrl?: string, referralClickId?: string) {
  const normalized = normalizeWallet(walletAddress);
  const existing = await prisma.user.findUnique({ where: { walletAddress: normalized } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { lastSeenAt: new Date() } });
    return { user: existing, created: false, referralApplied: false };
  }

  const referrer = referralCodeFromUrl
    ? await prisma.user.findUnique({ where: { referralCode: referralCodeFromUrl.trim().toUpperCase() } })
    : null;
  if (referrer?.walletAddress === normalized) throw new Error("Self-referral is not allowed.");
  if (referrer?.isBanned) throw new Error("Referral code is not available.");

  const user = await prisma.user.create({
    data: {
      walletAddress: normalized,
      referralCode: await generateReferralCode(),
      referredById: referrer?.id
    }
  });

  await awardXp(user.id, "REGISTER_WALLET", { dedupeKey: actionKey("REGISTER_WALLET", normalized) });

  if (referrer) {
    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: user.id,
        status: "PENDING",
        source: "referral_link"
      }
    });
    await awardXp(referrer.id, "REFER_SIGNUP", {
      dedupeKey: `REFER_SIGNUP:${referrer.id}:${user.id}`,
      metadata: { referredUserId: user.id }
    });
    await prisma.referralClick.updateMany({
      where: { id: referralClickId, referralCode: referrer.referralCode, convertedAt: null },
      data: { convertedAt: new Date() }
    });
  }

  await maybeAwardInviteQuests(referrer?.id);
  return { user: await getUserByWallet(normalized), created: true, referralApplied: Boolean(referrer) };
}

export async function getUserByWallet(walletAddress: string) {
  return prisma.user.findUnique({
    where: { walletAddress: normalizeWallet(walletAddress) },
    include: {
      referralsMade: true,
      referralEntry: true,
      xpLedger: true,
      completions: { include: { quest: true } }
    }
  });
}

export async function referralStats(userId: string) {
  const [invited, qualified, pending, referralXp] = await Promise.all([
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.referral.count({ where: { referrerId: userId, status: "QUALIFIED" } }),
    prisma.referral.count({ where: { referrerId: userId, status: "PENDING" } }),
    prisma.xpLedger.aggregate({
      where: { userId, actionType: { in: ["REFER_SIGNUP", "REFER_QUALIFIED", "INVITE_1_FRIEND", "INVITE_5_FRIENDS"] } },
      _sum: { points: true }
    })
  ]);
  return { invited, qualified, pending, xpFromReferrals: referralXp._sum.points ?? 0 };
}

export async function userQuests(userId: string) {
  await seedQuests();
  const quests = await prisma.quest.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  const completions = await prisma.questCompletion.findMany({ where: { userId }, include: { quest: true } });
  return quests.map((quest: { id: string; key: string; title: string; description: string; points: number; requiresVerification: boolean }) => {
    const completion = completions.find((item: { questId: string; status: "PENDING" | "APPROVED" | "REJECTED" }) => item.questId === quest.id);
    return {
      key: quest.key,
      title: quest.title,
      description: quest.description,
      points: quest.points,
      status: completion?.status ?? "AVAILABLE",
      automatic: ["REGISTER_WALLET", "CONNECT_WALLET_DAILY", "COMPLETE_TESTNET_BUY", "INVITE_1_FRIEND", "INVITE_5_FRIENDS", "FEEDBACK_SUBMITTED"].includes(quest.key),
      manualLabel: quest.requiresVerification ? "Coming soon/manual verification" : undefined
    };
  });
}

export async function ensureQuestCompletion(userId: string, key: string, status: "PENDING" | "APPROVED" | "REJECTED" = "APPROVED", proof?: string) {
  await seedQuests();
  const quest = await prisma.quest.findUnique({ where: { key } });
  if (!quest) return null;
  const existing = await prisma.questCompletion.findFirst({ where: { userId, questId: quest.id } });
  if (existing) return existing;
  return prisma.questCompletion.create({
    data: {
      userId,
      questId: quest.id,
      status,
      proof,
      approvedAt: status === "APPROVED" ? new Date() : undefined
    }
  });
}

export async function verifyTestnetBuy(walletAddress: string) {
  if (!hasConfiguredContracts()) {
    return { verified: false, error: "Contract addresses are not configured." };
  }
  try {
    const client = createPublicClient({
      chain: targetChain,
      transport: http()
    });
    const userInfo = (await client.readContract({
      address: contracts.skipPresale,
      abi: abis.skipPresale,
      functionName: "getUserInfo",
      args: [normalizeWallet(walletAddress) as Address]
    })) as readonly [bigint, bigint, bigint, bigint, boolean] | { contributed: bigint };
    const contributed = Array.isArray(userInfo) ? userInfo[0] : (userInfo as { contributed: bigint }).contributed;
    return { verified: contributed > 0n };
  } catch (error) {
    return { verified: false, error: error instanceof Error ? error.message : "Could not verify testnet contribution." };
  }
}

export async function maybeQualifyReferral(referredUserId: string) {
  const referral = await prisma.referral.findUnique({
    where: { referredUserId },
    include: { referredUser: true, referrer: true }
  });
  if (!referral || referral.status !== "PENDING") return { qualified: false };

  const hasBuy = await prisma.xpLedger.findFirst({ where: { userId: referredUserId, actionType: "COMPLETE_TESTNET_BUY" } });
  const qualifies = Boolean(hasBuy) || referral.referredUser.xpTotal >= 500;
  if (!qualifies) return { qualified: false };

  await prisma.referral.update({
    where: { id: referral.id },
    data: { status: "QUALIFIED", qualifiedAt: new Date() }
  });
  await awardXp(referral.referrerId, "REFER_QUALIFIED", {
    dedupeKey: `REFER_QUALIFIED:${referral.referrerId}:${referredUserId}`,
    metadata: { referredUserId }
  });
  return { qualified: true };
}

export async function maybeAwardInviteQuests(userId?: string) {
  if (!userId) return;
  const count = await prisma.referral.count({ where: { referrerId: userId } });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  if (count >= 1) {
    await ensureQuestCompletion(userId, "INVITE_1_FRIEND");
    await awardXp(userId, "INVITE_1_FRIEND", { dedupeKey: actionKey("INVITE_1_FRIEND", user.walletAddress) });
  }
  if (count >= 5) {
    await ensureQuestCompletion(userId, "INVITE_5_FRIENDS");
    await awardXp(userId, "INVITE_5_FRIENDS", { dedupeKey: actionKey("INVITE_5_FRIENDS", user.walletAddress) });
  }
}

export async function leaderboard(limit = 100) {
  const users = await prisma.user.findMany({
    where: { isBanned: false },
    orderBy: [{ xpTotal: "desc" }, { createdAt: "asc" }],
    take: limit,
    include: { referralsMade: true }
  });
  return users.map((user: { walletAddress: string; referralCode: string; xpTotal: number; rank: string; isOgFounder: boolean; referralsMade: Array<{ status: string }>; createdAt: Date }, index: number) => ({
    position: index + 1,
    walletAddress: user.walletAddress,
    referralCode: user.referralCode,
    xpTotal: user.xpTotal,
    rank: user.rank,
    isOgFounder: user.isOgFounder || index < 500,
    referralCount: user.referralsMade.length,
    qualifiedReferralCount: user.referralsMade.filter((referral: { status: string }) => referral.status === "QUALIFIED").length
  }));
}

export async function adminReferralSummary() {
  const [totalUsers, totalClicks, totalReferrals, qualifiedReferrals, pendingReferrals, xpTotal, topUsers, topReferrers, clicks] =
    await Promise.all([
      prisma.user.count(),
      prisma.referralClick.count(),
      prisma.referral.count(),
      prisma.referral.count({ where: { status: "QUALIFIED" } }),
      prisma.referral.count({ where: { status: "PENDING" } }),
      prisma.xpLedger.aggregate({ _sum: { points: true } }),
      leaderboard(25),
      prisma.user.findMany({ include: { referralsMade: true }, take: 100 }),
      prisma.referralClick.findMany({ take: 500, orderBy: { createdAt: "desc" } })
    ]);

  const suspicious = topReferrers
    .map((user: { id: string; walletAddress: string; referralCode: string; referralsMade: Array<{ status: string; createdAt: Date }>; isBanned: boolean }) => {
      const referredCount = user.referralsMade.length;
      const qualifiedCount = user.referralsMade.filter((referral: { status: string }) => referral.status === "QUALIFIED").length;
      const recent = user.referralsMade.filter((referral: { createdAt: Date }) => Date.now() - referral.createdAt.getTime() < 24 * 60 * 60 * 1000).length;
      const userAgentCounts = clicks
        .filter((click: { referrerId: string | null; userAgentHash: string | null }) => click.referrerId === user.id && click.userAgentHash)
        .reduce<Record<string, number>>((acc: Record<string, number>, click: { userAgentHash: string | null }) => {
          acc[click.userAgentHash ?? ""] = (acc[click.userAgentHash ?? ""] ?? 0) + 1;
          return acc;
        }, {});
      const sameUa = Math.max(0, ...(Object.values(userAgentCounts) as number[]));
      return {
        walletAddress: user.walletAddress,
        referralCode: user.referralCode,
        referredCount,
        qualifiedCount,
        flags: suspiciousFlags({ signupsLastDay: recent, sameUserAgentClicks: sameUa, referredCount, qualifiedCount }),
        isBanned: user.isBanned
      };
    })
    .filter((item: { flags: string[] }) => item.flags.length > 0);

  return {
    totals: {
      totalUsers,
      totalRegisteredWallets: totalUsers,
      totalReferralClicks: totalClicks,
      totalReferrals,
      qualifiedReferrals,
      pendingReferrals,
      xpIssuedTotal: xpTotal._sum.points ?? 0,
      clickToRegistrationRate: totalClicks > 0 ? totalReferrals / totalClicks : 0,
      registrationToQualifiedRate: totalReferrals > 0 ? qualifiedReferrals / totalReferrals : 0
    },
    topUsers,
    topReferrers: topUsers.filter((user: { referralCount: number }) => user.referralCount > 0),
    suspicious,
    csv: {
      users: "/api/referral/admin?export=users",
      referrals: "/api/referral/admin?export=referrals",
      xpLedger: "/api/referral/admin?export=xp"
    }
  };
}
