import { NextRequest, NextResponse } from "next/server";
import { requestHashes } from "../../../../lib/anti-abuse";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { referralCode?: string };
  const referralCode = body.referralCode?.trim().toUpperCase();
  if (!referralCode) return NextResponse.json({ error: "referralCode is required." }, { status: 400 });
  const referrer = await prisma.user.findUnique({ where: { referralCode } });
  const hashes = requestHashes(request);
  const click = await prisma.referralClick.create({
    data: {
      referralCode,
      referrerId: referrer?.id,
      ipHash: hashes.ipHash,
      userAgentHash: hashes.userAgentHash
    }
  });
  return NextResponse.json({ ok: true, clickId: click.id, validCode: Boolean(referrer && !referrer.isBanned) });
}
