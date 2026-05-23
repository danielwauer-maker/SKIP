import { NextRequest, NextResponse } from "next/server";
import { adminReferralSummary } from "../../../../lib/referral";
import { prisma } from "../../../../lib/prisma";
import { isAdminRequestAuthenticated } from "../../../../lib/admin-auth";

function csv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

export async function GET(request: NextRequest) {
  if (!isAdminRequestAuthenticated(request)) return NextResponse.json({ error: "Admin session required." }, { status: 401 });
  const exportType = request.nextUrl.searchParams.get("export");
  if (exportType === "users") {
    const rows = await prisma.user.findMany({ orderBy: { xpTotal: "desc" } });
    return new NextResponse(csv(rows as unknown as Record<string, unknown>[]), { headers: { "content-type": "text/csv" } });
  }
  if (exportType === "referrals") {
    const rows = await prisma.referral.findMany({ include: { referrer: true, referredUser: true } });
    return new NextResponse(
      csv(
        rows.map((row: { id: string; referrer: { walletAddress: string }; referredUser: { walletAddress: string }; status: string; createdAt: Date; qualifiedAt: Date | null }) => ({
          id: row.id,
          referrer: row.referrer.walletAddress,
          referredUser: row.referredUser.walletAddress,
          status: row.status,
          createdAt: row.createdAt,
          qualifiedAt: row.qualifiedAt
        }))
      ),
      { headers: { "content-type": "text/csv" } }
    );
  }
  if (exportType === "xp") {
    const rows = await prisma.xpLedger.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } });
    return new NextResponse(
      csv(rows.map((row: { id: string; user: { walletAddress: string }; actionType: string; points: number; createdAt: Date }) => ({ id: row.id, walletAddress: row.user.walletAddress, actionType: row.actionType, points: row.points, createdAt: row.createdAt }))),
      { headers: { "content-type": "text/csv" } }
    );
  }
  return NextResponse.json(await adminReferralSummary());
}
