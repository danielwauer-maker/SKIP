import { NextResponse } from "next/server";
import { leaderboard } from "../../../../lib/referral";

export async function GET() {
  return NextResponse.json({ users: await leaderboard(100) });
}
