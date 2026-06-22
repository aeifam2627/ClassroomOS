import { createHmac, timingSafeEqual } from "crypto";

// Session ของนักเรียนไม่ได้ผ่าน Supabase Auth (login ด้วยรหัสนักเรียน + PIN เอง)
// จึงใช้ cookie ที่ sign ด้วย HMAC เอง แทน JWT library เพื่อไม่เพิ่ม dependency โดยไม่จำเป็น
// session ผูกแค่ studentId (ไม่ผูกวิชา) เพราะนักเรียนคนหนึ่ง login ครั้งเดียวแล้วดูได้ทุกวิชาที่ลงทะเบียนไว้
export const STUDENT_SESSION_COOKIE = "student_session";
export const STUDENT_SESSION_TTL_SECONDS = 60 * 60 * 4; // 4 ชั่วโมง

export type StudentSession = { studentId: string };

function getSecret(): string {
  const secret = process.env.STUDENT_SESSION_SECRET;
  if (!secret) {
    throw new Error("กรุณาตั้งค่า STUDENT_SESSION_SECRET ใน .env.local ก่อนใช้งานระบบนักเรียน");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(session: StudentSession): string {
  const expiresAt = Date.now() + STUDENT_SESSION_TTL_SECONDS * 1000;
  const payload = `${session.studentId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): StudentSession | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [studentId, expiresAtRaw, signature] = parts;
  const payload = `${studentId}.${expiresAtRaw}`;
  const expected = sign(payload);

  const provided = Buffer.from(signature);
  const computed = Buffer.from(expected);
  if (provided.length !== computed.length || !timingSafeEqual(provided, computed)) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return { studentId };
}
