import { NextRequest, NextResponse } from "next/server";
import { isValidWallet } from "../../../../lib/anti-abuse";
import { generateReferralCode, getUserByWallet, referralUrl } from "../../../../lib/referral";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { walletAddress?: string };
  if (!body.walletAddress || !isValidWallet(body.walletAddress)) {
    return NextResponse.json({ error: "Valid walletAddress is required." }, { status: 400 });
  }
  const user = await getUserByWallet(body.walletAddress);
  if (!user) return NextResponse.json({ error: "Register wallet before claiming a code." }, { status: 404 });
  if (user.referralCode) return NextResponse.json({ referralCode: user.referralCode, referralUrl: referralUrl(user.referralCode) });
  const referralCode = await generateReferralCode();
  await prisma.user.update({ where: { id: user.id }, data: { referralCode } });
  return NextResponse.json({ referralCode, referralUrl: referralUrl(referralCode) });
}
