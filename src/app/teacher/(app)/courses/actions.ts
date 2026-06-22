"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CourseStatus } from "@/lib/course-status";

function getRequiredField(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`กรุณากรอก ${key}`);
  }
  return value;
}

function getStatus(formData: FormData): CourseStatus {
  const value = formData.get("status");
  if (value === "open" || value === "closed" || value === "upcoming") return value;
  return "upcoming";
}

function getScoreBasis(formData: FormData): "grade" | "points" {
  const value = formData.get("leaderboardScoreBasis");
  return value === "points" ? "points" : "grade";
}

function getVisibility(formData: FormData): "anonymous" | "alias" | "full_name" {
  const value = formData.get("leaderboardVisibility");
  if (value === "anonymous" || value === "alias") return value;
  return "full_name";
}

export async function createCourse(formData: FormData) {
  const code = getRequiredField(formData, "code");
  const name = getRequiredField(formData, "name");
  const term = getRequiredField(formData, "term");
  const academicYear = getRequiredField(formData, "academicYear");
  const status = getStatus(formData);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/teacher/login");

  const { error } = await supabase.from("courses").insert({
    owner_id: user.id,
    code,
    name,
    term,
    academic_year: academicYear,
    status,
  });

  if (error) {
    redirect(`/teacher/courses/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/courses");
  redirect(`/teacher/courses?notice=${encodeURIComponent("เพิ่มรายวิชาใหม่เรียบร้อยแล้ว")}`);
}

export async function updateCourse(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const code = getRequiredField(formData, "code");
  const name = getRequiredField(formData, "name");
  const term = getRequiredField(formData, "term");
  const academicYear = getRequiredField(formData, "academicYear");
  const status = getStatus(formData);
  const gamificationEnabled = formData.get("gamificationEnabled") === "on";
  const leaderboardScoreBasis = getScoreBasis(formData);
  const leaderboardVisibility = getVisibility(formData);

  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({
      code,
      name,
      term,
      academic_year: academicYear,
      status,
      gamification_enabled: gamificationEnabled,
      leaderboard_score_basis: leaderboardScoreBasis,
      leaderboard_visibility: leaderboardVisibility,
    })
    .eq("id", courseId);

  if (error) {
    redirect(`/teacher/courses/${courseId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/courses");
  redirect(`/teacher/courses?notice=${encodeURIComponent("บันทึกการแก้ไขวิชาเรียบร้อยแล้ว")}`);
}

export async function deleteCourse(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");

  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);

  if (error) {
    redirect(`/teacher/courses?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/courses");
  redirect(`/teacher/courses?notice=${encodeURIComponent("ลบรายวิชาเรียบร้อยแล้ว")}`);
}
