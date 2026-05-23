import { NextRequest, NextResponse } from "next/server";
import { isValidWallet } from "../../../../lib/anti-abuse";
import { ensureQuestCompletion, registerWallet, referralStats, userQuests } from "../../../../lib/referral";
import { rankProgress } from "../../../../lib/ranks";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { walletAddress?: string; referralCodeFromUrl?: string; referralClickId?: string };
    if (!body.walletAddress || !isValidWallet(body.walletAddress)) {
      return NextResponse.json({ error: "Valid walletAddress is required." }, { status: 400 });
    }
    const result = await registerWallet(body.walletAddress, body.referralCodeFromUrl, body.referralClickId);
    if (!result.user) return NextResponse.json({ error: "Could not register wallet." }, { status: 500 });
    await ensureQuestCompletion(result.user.id, "REGISTER_WALLET");
    const stats = await referralStats(result.user.id);
    const quests = await userQuests(result.user.id);
    return NextResponse.json({
      user: result.user,
      created: result.created,
      referralApplied: result.referralApplied,
      stats,
      quests,
      rank: rankProgress(result.user.xpTotal)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Registration failed." }, { status: 400 });
  }
}
