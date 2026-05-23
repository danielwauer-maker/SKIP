import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const cookieName = "skip_admin_session";
const sessionTtlSeconds = 8 * 60 * 60;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function validSignature(value: string, signature: string) {
  const expected = sign(value);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isAdminAuthConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export function createAdminSessionValue() {
  if (!isAdminAuthConfigured()) throw new Error("ADMIN_PASSWORD and ADMIN_SESSION_SECRET must be configured.");
  const expiresAt = Math.floor(Date.now() / 1000) + sessionTtlSeconds;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt }), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionValue(value?: string) {
  if (!value || !isAdminAuthConfigured()) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !validSignature(payload, signature)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function hasAdminSession() {
  const store = await cookies();
  return verifyAdminSessionValue(store.get(cookieName)?.value);
}

export function isAdminRequestAuthenticated(request: NextRequest) {
  if (verifyAdminSessionValue(request.cookies.get(cookieName)?.value)) return true;
  const legacySecret = process.env.REFERRAL_ADMIN_SECRET;
  return Boolean(legacySecret && request.headers.get("x-admin-secret") === legacySecret);
}

export function setAdminSessionCookie(response: NextResponse, value: string) {
  response.cookies.set(cookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function validateAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || !process.env.ADMIN_SESSION_SECRET) return false;
  const left = Buffer.from(password);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
