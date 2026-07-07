import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "ve_admin";

function adminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

/** SHA-256-Token des Admin-Passworts — landet im httpOnly-Cookie statt Klartext. */
export function adminToken(): string | null {
  const pw = adminPassword();
  return pw ? createHash("sha256").update(pw).digest("hex") : null;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function verifyPassword(pw: string): boolean {
  const expected = adminPassword();
  return !!expected && !!pw && safeEqual(pw, expected);
}

/** Admin-Session in Server Components prüfen (Cookie). */
export async function isAdminSession(): Promise<boolean> {
  const token = adminToken();
  if (!token) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!value && safeEqual(value, token);
}

/**
 * Admin-Rechte in Route-Handlern prüfen: httpOnly-Cookie (Admin-UI)
 * oder Header `x-admin-key: <ADMIN_PASSWORD>` (Skripte/Cron).
 * Ohne gesetztes ADMIN_PASSWORD wird immer abgelehnt (fail closed).
 */
export function isAdminRequest(req: Request): boolean {
  const expected = adminPassword();
  if (!expected) return false;

  const headerKey = req.headers.get("x-admin-key");
  if (headerKey && safeEqual(headerKey, expected)) return true;

  const token = adminToken();
  if (!token) return false;
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)ve_admin=([^;]+)/);
  return !!match && safeEqual(decodeURIComponent(match[1]), token);
}
