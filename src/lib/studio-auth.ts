import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.STUDIO_SESSION_SECRET || process.env.NEXTAUTH_SECRET || "apero-dev-secret-change-me";

const ADMIN_COOKIE = "studio_admin_session";
const ADMIN_SUBJECT = "keybelh-ruiz-admin";
const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

function sign(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

function createToken(purpose: string, subject: string, maxAgeMs = THIRTY_DAYS) {
  const exp = Date.now() + maxAgeMs;
  const payload = `${purpose}:${subject}:${exp}`;
  return Buffer.from(`${payload}:${sign(payload)}`).toString("base64url");
}

function verifyToken(token: string | undefined, purpose: string, subject: string): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return false;
    const [p, subj, expStr, sig] = parts;
    if (p !== purpose || subj !== subject) return false;
    if (Date.now() > Number(expStr)) return false;
    const expected = sign(`${p}:${subj}:${expStr}`);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function safeEqual(a: string, b: string) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function isStudioAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(ADMIN_COOKIE)?.value, "admin", ADMIN_SUBJECT);
}

export async function setStudioAdminSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, createToken("admin", ADMIN_SUBJECT), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS / 1000,
  });
}

export async function clearStudioAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export function galleryCookieName(clientId: string) {
  return `studio_gallery_${clientId}`;
}

export async function isGalleryUnlocked(clientId: string): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(galleryCookieName(clientId))?.value, "gallery", clientId);
}

export async function setGallerySession(clientId: string) {
  const jar = await cookies();
  jar.set(galleryCookieName(clientId), createToken("gallery", clientId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS / 1000,
  });
}
