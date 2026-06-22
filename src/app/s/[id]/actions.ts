"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyStudentPin } from "@/lib/student-auth";
import { createSessionToken, STUDENT_SESSION_COOKIE, STUDENT_SESSION_TTL_SECONDS } from "@/lib/student-session";

// Login จากลิงก์/QR เฉพาะวิชา — รู้ owner_id ของวิชานี้อยู่แล้ว จึงค้นแค่ในรายชื่อของครูคนนั้น (เร็วกว่า + ไม่กำกวมข้ามครู)
export async function studentLogin(formData: FormData) {
  const courseId = formData.get("courseId") as string;
  const studentCode = ((formData.get("studentCode") as string | null) ?? "").trim();
  const pin = ((formData.get("pin") as string | null) ?? "").trim();

  if (!studentCode || !pin) {
    redirect(`/s/${courseId}?error=${encodeURIComponent("กรุณากรอกรหัสนักเรียนและ PIN")}`);
  }

  const supabase = createServiceClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, owner_id")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) {
    redirect(`/s/${courseId}?error=${encodeURIComponent("ลิงก์เข้าดูคะแนนไม่ถูกต้อง")}`);
  }

  const result = await verifyStudentPin(studentCode, pin, course.owner_id);

  if (!result.ok) {
    redirect(`/s/${courseId}?error=${encodeURIComponent(result.error)}`);
  }

  const { data: enrollment } = await supabase
    .from("course_students")
    .select("student_id")
    .eq("course_id", courseId)
    .eq("student_id", result.studentId)
    .maybeSingle();

  if (!enrollment) {
    redirect(`/s/${courseId}?error=${encodeURIComponent("นักเรียนคนนี้ไม่ได้อยู่ในวิชานี้")}`);
  }

  const token = createSessionToken({ studentId: result.studentId });
  const cookieStore = await cookies();
  cookieStore.set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STUDENT_SESSION_TTL_SECONDS,
    path: "/",
  });

  redirect(`/s/${courseId}`);
}
