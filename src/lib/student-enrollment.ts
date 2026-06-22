import bcrypt from "bcryptjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generatePin } from "@/lib/pin";

export type EnrollResult = {
  code: string;
  name: string;
  pin: string | null;
  created: boolean;
};

/**
 * เพิ่มนักเรียนเข้าวิชา — ถ้ารหัสนักเรียนนี้มีอยู่แล้วของครูคนนี้ (unique ต่อ owner_id)
 * จะแค่เพิ่มเข้าวิชาโดยไม่สร้างซ้ำหรือสร้าง PIN ใหม่ (ใช้รหัสเดิม)
 */
export async function upsertAndEnrollStudent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  ownerId: string,
  courseId: string,
  code: string,
  name: string,
  title: string = "ไม่ระบุ",
): Promise<EnrollResult> {
  const { data: existing } = await supabase
    .from("students")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("student_code", code)
    .maybeSingle();

  let studentId: string | undefined = existing?.id;
  let pin: string | null = null;
  let created = false;

  if (!studentId) {
    pin = generatePin();
    const pinHash = await bcrypt.hash(pin, 10);
    const { data: inserted, error } = await supabase
      .from("students")
      .insert({ owner_id: ownerId, student_code: code, name, title, pin_hash: pinHash })
      .select("id")
      .single();

    if (error || !inserted) {
      throw new Error(error?.message ?? "ไม่สามารถสร้างนักเรียนได้");
    }
    studentId = inserted.id;
    created = true;
  }

  const { error: enrollError } = await supabase
    .from("course_students")
    .upsert(
      { course_id: courseId, student_id: studentId },
      { onConflict: "course_id,student_id", ignoreDuplicates: true },
    );

  if (enrollError) {
    throw new Error(enrollError.message);
  }

  return { code, name, pin, created };
}
