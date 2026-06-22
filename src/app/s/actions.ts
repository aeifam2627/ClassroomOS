"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyStudentPin } from "@/lib/student-auth";
import { createSessionToken, STUDENT_SESSION_COOKIE, STUDENT_SESSION_TTL_SECONDS } from "@/lib/student-session";

// Login แบบ global จากหน้า landing — ไม่รู้ว่าเป็นวิชา/ครูคนไหนล่วงหน้า ค้นรหัสนักเรียนข้ามครูทุกคนแล้วใช้ PIN ยืนยันตัวจริง
export async function studentLoginGlobal(formData: FormData) {
  const studentCode = ((formData.get("studentCode") as string | null) ?? "").trim();
  const pin = ((formData.get("pin") as string | null) ?? "").trim();

  if (!studentCode || !pin) {
    redirect(`/s?error=${encodeURIComponent("กรุณากรอกรหัสนักเรียนและ PIN")}`);
  }

  const result = await verifyStudentPin(studentCode, pin);

  if (!result.ok) {
    redirect(`/s?error=${encodeURIComponent(result.error)}`);
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

  redirect("/s/courses");
}

// logout ใช้ร่วมกันทุกหน้านักเรียน — ระบุ redirectTo ได้ (ดีฟอลต์กลับไปหน้า login กลาง)
export async function studentLogout(formData: FormData) {
  const redirectTo = (formData.get("redirectTo") as string | null) || "/s";
  const cookieStore = await cookies();
  cookieStore.delete(STUDENT_SESSION_COOKIE);
  redirect(redirectTo);
}
