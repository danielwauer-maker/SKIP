import { NextRequest, NextResponse } from "next/server";
import { isValidWallet } from "../../../../lib/anti-abuse";
import { getUserByWallet, referralStats, referralUrl, userQuests } from "../../../../lib/referral";
import { rankProgress } from "../../../../lib/ranks";

export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get("walletAddress");
  if (!walletAddress || !isValidWallet(walletAddress)) {
    return NextResponse.json({ error: "Valid walletAddress is required." }, { status: 400 });
  }
  const user = await getUserByWallet(walletAddress);
  if (!user) return NextResponse.json({ user: null });
  const stats = await referralStats(user.id);
  const quests = await userQuests(user.id);
  return NextResponse.json({
    user,
    stats,
    quests,
    rank: rankProgress(user.xpTotal),
    referralUrl: referralUrl(user.referralCode)
  });
}
