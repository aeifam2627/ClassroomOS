"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/lib/attendance-status";

function getRequiredField(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`กรุณากรอก ${key}`);
  }
  return value.trim();
}

export async function saveAttendance(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const sessionDate = getRequiredField(formData, "sessionDate");
  const studentIds = formData.getAll("studentId").map(String);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่ได้เข้าสู่ระบบ");

  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .upsert(
      { course_id: courseId, session_date: sessionDate, created_by: user.id },
      { onConflict: "course_id,session_date" },
    )
    .select("id")
    .single();

  if (sessionError || !session) {
    redirect(
      `/teacher/courses/${courseId}/attendance?date=${sessionDate}&error=${encodeURIComponent(
        sessionError?.message ?? "บันทึกการเช็คชื่อไม่สำเร็จ",
      )}`,
    );
  }

  const records = studentIds.map((studentId) => ({
    session_id: session.id,
    student_id: studentId,
    status: ((formData.get(`status-${studentId}`) as string | null) ?? "present") as AttendanceStatus,
    note: (formData.get(`note-${studentId}`) as string | null) ?? "",
    updated_by: user.id,
  }));

  if (records.length > 0) {
    const { error: recordsError } = await supabase
      .from("attendance_records")
      .upsert(records, { onConflict: "session_id,student_id" });

    if (recordsError) {
      redirect(
        `/teacher/courses/${courseId}/attendance?date=${sessionDate}&error=${encodeURIComponent(recordsError.message)}`,
      );
    }
  }

  revalidatePath(`/teacher/courses/${courseId}/attendance`);
  redirect(`/teacher/courses/${courseId}/attendance?date=${sessionDate}&saved=1`);
}
