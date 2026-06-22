"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function getRequiredField(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`กรุณากรอก ${key}`);
  }
  return value.trim();
}

export async function awardPoints(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const studentId = getRequiredField(formData, "studentId");
  const pointsRaw = getRequiredField(formData, "points");
  const reason = (formData.get("reason") as string | null)?.trim() ?? "";

  const points = Number(pointsRaw);
  if (!Number.isFinite(points) || points === 0) {
    redirect(
      `/teacher/courses/${courseId}/leaderboard?error=${encodeURIComponent("กรุณากรอกจำนวนแต้มเป็นตัวเลขที่ไม่ใช่ 0")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่ได้เข้าสู่ระบบ");

  const { error } = await supabase.from("point_events").insert({
    course_id: courseId,
    student_id: studentId,
    points,
    reason,
    created_by: user.id,
  });

  if (error) {
    redirect(`/teacher/courses/${courseId}/leaderboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/teacher/courses/${courseId}/leaderboard`);
  redirect(`/teacher/courses/${courseId}/leaderboard?saved=1`);
}
