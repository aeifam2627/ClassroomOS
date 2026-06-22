import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export const STUDENT_LOGIN_GENERIC_ERROR = "รหัสนักเรียนหรือ PIN ไม่ถูกต้อง";

// hash หลอกไว้เทียบเวลาให้เท่ากับกรณีเจอนักเรียนจริง กันเดารหัสนักเรียนจาก response time (timing attack)
const DUMMY_HASH = bcrypt.hashSync("no-such-student-placeholder", 10);

export function studentLockedMessage(): string {
  return `กรอกผิดหลายครั้งเกินไป กรุณารออีก ${LOCK_MINUTES} นาทีแล้วลองใหม่`;
}

type StudentCandidate = {
  id: string;
  pin_hash: string;
  pin_failed_attempts: number;
  pin_locked_until: string | null;
};

export type VerifyPinResult =
  | { ok: true; studentId: string }
  | { ok: false; error: string };

// ตรวจรหัสนักเรียน + PIN
// - ระบุ ownerId (เช่น มาจากลิงก์/QR เฉพาะวิชา รู้อยู่แล้วว่าวิชานี้ของครูคนไหน) → ค้นแค่ในรายชื่อของครูคนนั้น
// - ไม่ระบุ ownerId (login แบบ global ที่หน้า /s ไม่รู้ context ล่วงหน้า) → ค้นรหัสนักเรียนข้ามครูทุกคน
//   (รหัสนักเรียน unique แค่ภายในครูคนเดียวตามกฎ schema ครูคนละคนมีรหัสซ้ำกันได้) แล้วใช้ PIN เป็นตัวยืนยันตัวจริง
//   เทียบ PIN กับทุกคนที่รหัสตรงกัน คนที่ PIN ถูกคือตัวจริง
export async function verifyStudentPin(
  studentCode: string,
  pin: string,
  ownerId?: string,
): Promise<VerifyPinResult> {
  const supabase = createServiceClient();

  let query = supabase
    .from("students")
    .select("id, pin_hash, pin_failed_attempts, pin_locked_until")
    .eq("student_code", studentCode);

  if (ownerId) query = query.eq("owner_id", ownerId);

  const { data: candidates } = await query.returns<StudentCandidate[]>();

  if (!candidates || candidates.length === 0) {
    await bcrypt.compare(pin, DUMMY_HASH);
    return { ok: false, error: STUDENT_LOGIN_GENERIC_ERROR };
  }

  const now = new Date();
  const unlocked = candidates.filter(
    (c) => !c.pin_locked_until || new Date(c.pin_locked_until) <= now,
  );

  if (unlocked.length === 0) {
    return { ok: false, error: studentLockedMessage() };
  }

  for (const candidate of unlocked) {
    const isMatch = await bcrypt.compare(pin, candidate.pin_hash);
    if (isMatch) {
      await supabase
        .from("students")
        .update({ pin_failed_attempts: 0, pin_locked_until: null })
        .eq("id", candidate.id);
      return { ok: true, studentId: candidate.id };
    }
  }

  // ผิดทุกคนที่ตรวจได้ — เพิ่มตัวนับผิดของทุกแถวที่รหัสนักเรียนตรงกัน (ไม่รู้ว่าผู้ใช้ตั้งใจหมายถึงใคร กันเดา PIN ไล่ทีละแถว)
  await Promise.all(
    unlocked.map((candidate) => {
      const nextAttempts = (candidate.pin_failed_attempts ?? 0) + 1;
      const shouldLock = nextAttempts >= MAX_FAILED_ATTEMPTS;
      return supabase
        .from("students")
        .update({
          pin_failed_attempts: shouldLock ? 0 : nextAttempts,
          pin_locked_until: shouldLock
            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
            : null,
        })
        .eq("id", candidate.id);
    }),
  );

  return { ok: false, error: STUDENT_LOGIN_GENERIC_ERROR };
}
