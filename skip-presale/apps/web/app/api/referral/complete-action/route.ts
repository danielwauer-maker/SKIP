import { NextRequest, NextResponse } from "next/server";
import { isValidWallet } from "../../../../lib/anti-abuse";
import { ensureQuestCompletion, getUserByWallet, maybeQualifyReferral, verifyTestnetBuy } from "../../../../lib/referral";
import { actionKey, awardXp, dailyKey, xpActions } from "../../../../lib/xp";
import type { XpActionType } from "../../../../types/referral";

const manualActions = new Set<XpActionType>(["JOIN_COMMUNITY", "BUG_REPORT", "MEME_SUBMISSION", "SHARE_SKIP"]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { walletAddress?: string; actionType?: XpActionType; proof?: string };
    if (!body.walletAddress || !isValidWallet(body.walletAddress)) {
      return NextResponse.json({ error: "Valid walletAddress is required." }, { status: 400 });
    }
    if (!body.actionType || !(body.actionType in xpActions)) {
      return NextResponse.json({ error: "Supported actionType is required." }, { status: 400 });
    }
    const user = await getUserByWallet(body.walletAddress);
    if (!user) return NextResponse.json({ error: "Register wallet first." }, { status: 404 });
    if (user.isBanned) return NextResponse.json({ error: "This wallet is not eligible." }, { status: 403 });

    if (manualActions.has(body.actionType)) {
      await ensureQuestCompletion(user.id, body.actionType, "PENDING", body.proof);
      return NextResponse.json({ awarded: false, pending: true, message: "Manual verification queued. No XP awarded yet." });
    }

    if (body.actionType === "COMPLETE_TESTNET_BUY") {
      const verified = await verifyTestnetBuy(user.walletAddress);
      if (!verified.verified) {
        return NextResponse.json({ awarded: false, error: verified.error || "No testnet contribution found." }, { status: 400 });
      }
    }

    const dedupeKey =
      body.actionType === "CONNECT_WALLET_DAILY"
        ? dailyKey(body.actionType, user.walletAddress)
        : actionKey(body.actionType, user.walletAddress);
    const award = await awardXp(user.id, body.actionType, { dedupeKey, metadata: body.proof ? { proof: body.proof } : undefined });
    if (award.awarded) await ensureQuestCompletion(user.id, body.actionType);
    await maybeQualifyReferral(user.id);
    return NextResponse.json({ ...award });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not complete action." }, { status: 400 });
  }
}
