import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionValue, setAdminSessionCookie, validateAdminPassword } from "../../../../lib/admin-auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  if (!validateAdminPassword(password)) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), { status: 303 });
  }
  const response = NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
  setAdminSessionCookie(response, createAdminSessionValue());
  return response;
}
