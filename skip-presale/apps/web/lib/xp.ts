import { prisma } from "./prisma";
import { isFounderRank, rankForXp } from "./ranks";
import type { XpActionType } from "../types/referral";

export const xpActions: Record<XpActionType, number> = {
  REGISTER_WALLET: 100,
  CONNECT_WALLET_DAILY: 25,
  COMPLETE_TESTNET_BUY: 250,
  REFER_SIGNUP: 150,
  REFER_QUALIFIED: 500,
  JOIN_COMMUNITY: 100,
  BUG_REPORT: 300,
  FEEDBACK_SUBMITTED: 150,
  MEME_SUBMISSION: 100,
  INVITE_1_FRIEND: 150,
  INVITE_5_FRIENDS: 400,
  SHARE_SKIP: 100
};

export function dailyKey(actionType: XpActionType, walletAddress: string, date = new Date()) {
  return `${actionType}:${walletAddress.toLowerCase()}:${date.toISOString().slice(0, 10)}`;
}

export function actionKey(actionType: XpActionType, walletAddress: string, suffix = "once") {
  return `${actionType}:${walletAddress.toLowerCase()}:${suffix}`;
}

export async function awardXp(userId: string, actionType: XpActionType, options?: { points?: number; dedupeKey?: string; metadata?: unknown }) {
  const points = options?.points ?? xpActions[actionType];
  if (points <= 0) return { awarded: false, points: 0 };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ledger = await tx.xpLedger.create({
        data: {
          userId,
          actionType,
          points,
          dedupeKey: options?.dedupeKey,
          metadata: options?.metadata ? JSON.stringify(options.metadata) : undefined
        }
      });
      const user = await tx.user.update({
        where: { id: userId },
        data: { xpTotal: { increment: points }, lastSeenAt: new Date() }
      });
      const rank = rankForXp(user.xpTotal);
      const updated = await tx.user.update({
        where: { id: userId },
        data: { rank: rank.name, isOgFounder: isFounderRank(rank.name) }
      });
      return { ledger, user: updated };
    });
    return { awarded: true, points, ledger: result.ledger, user: result.user };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { awarded: false, points: 0 };
    }
    throw error;
  }
}

export async function syncUserRank(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const rank = rankForXp(user.xpTotal);
  return prisma.user.update({
    where: { id: userId },
    data: { rank: rank.name, isOgFounder: isFounderRank(rank.name) }
  });
}
