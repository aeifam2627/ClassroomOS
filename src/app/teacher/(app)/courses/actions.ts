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
  const section = ((formData.get("section") as string | null) ?? "").trim();

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
    section,
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
  const section = ((formData.get("section") as string | null) ?? "").trim();
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
      section,
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

// ทำสำเนาวิชา: คัดโครงสร้างคะแนนทั้งหมด (chapters, score_categories, grade_items, grading_scales)
// ไปสร้างวิชาใหม่ ใช้เวลาครูสอนวิชาเดียวกันหลายห้อง ไม่ต้องตั้งโครงสร้างคะแนนซ้ำทุกห้อง
// ไม่คัดนักเรียน/คะแนน/แต้ม/การเช็คชื่อ เพราะเป็นข้อมูลจริงของห้องเดิม ห้องใหม่ต้องเริ่มจากนักเรียนกลุ่มใหม่
export async function duplicateCourse(formData: FormData) {
  const sourceCourseId = getRequiredField(formData, "courseId");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/teacher/login");

  const { data: sourceCourse, error: sourceError } = await supabase
    .from("courses")
    .select(
      "code, name, term, academic_year, gamification_enabled, leaderboard_score_basis, leaderboard_visibility",
    )
    .eq("id", sourceCourseId)
    .single();

  if (sourceError || !sourceCourse) {
    redirect(`/teacher/courses?error=${encodeURIComponent("ไม่พบวิชาที่ต้องการทำสำเนา")}`);
  }

  const { data: newCourse, error: insertCourseError } = await supabase
    .from("courses")
    .insert({
      owner_id: user.id,
      code: sourceCourse.code,
      name: sourceCourse.name,
      term: sourceCourse.term,
      academic_year: sourceCourse.academic_year,
      status: "upcoming",
      section: "",
      gamification_enabled: sourceCourse.gamification_enabled,
      leaderboard_score_basis: sourceCourse.leaderboard_score_basis,
      leaderboard_visibility: sourceCourse.leaderboard_visibility,
    })
    .select("id")
    .single();

  if (insertCourseError || !newCourse) {
    redirect(
      `/teacher/courses?error=${encodeURIComponent(insertCourseError?.message ?? "ทำสำเนาวิชาไม่สำเร็จ")}`,
    );
  }

  const newCourseId = newCourse.id;

  const { data: sourceChapters } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("course_id", sourceCourseId);

  const chapterIdMap = new Map<string, string>();
  if (sourceChapters && sourceChapters.length > 0) {
    const { data: insertedChapters } = await supabase
      .from("chapters")
      .insert(sourceChapters.map((c) => ({ course_id: newCourseId, name: c.name })))
      .select("id, name");

    // จับคู่ตามลำดับที่ insert กลับมา (ชื่อเดิมคัดมาตรงๆ ลำดับ insert คงตามลำดับ select)
    sourceChapters.forEach((c, index) => {
      const inserted = insertedChapters?.[index];
      if (inserted) chapterIdMap.set(c.id, inserted.id);
    });
  }

  const { data: sourceCategories } = await supabase
    .from("score_categories")
    .select("id, name, weight_percent")
    .eq("course_id", sourceCourseId);

  const categoryIdMap = new Map<string, string>();
  if (sourceCategories && sourceCategories.length > 0) {
    const { data: insertedCategories } = await supabase
      .from("score_categories")
      .insert(
        sourceCategories.map((c) => ({
          course_id: newCourseId,
          name: c.name,
          weight_percent: c.weight_percent,
        })),
      )
      .select("id, name, weight_percent");

    sourceCategories.forEach((c, index) => {
      const inserted = insertedCategories?.[index];
      if (inserted) categoryIdMap.set(c.id, inserted.id);
    });

    const { data: sourceItems } = await supabase
      .from("grade_items")
      .select("category_id, title, description, max_score, chapter_id, due_at")
      .in("category_id", sourceCategories.map((c) => c.id));

    if (sourceItems && sourceItems.length > 0) {
      await supabase.from("grade_items").insert(
        sourceItems.map((item) => ({
          category_id: categoryIdMap.get(item.category_id)!,
          title: item.title,
          description: item.description,
          max_score: item.max_score,
          chapter_id: item.chapter_id ? chapterIdMap.get(item.chapter_id) ?? null : null,
          due_at: item.due_at,
        })),
      );
    }
  }

  const { data: sourceScales } = await supabase
    .from("grading_scales")
    .select("grade_letter, min_score, description, gpa_value")
    .eq("course_id", sourceCourseId);

  if (sourceScales && sourceScales.length > 0) {
    await supabase.from("grading_scales").insert(
      sourceScales.map((s) => ({
        course_id: newCourseId,
        grade_letter: s.grade_letter,
        min_score: s.min_score,
        description: s.description,
        gpa_value: s.gpa_value,
      })),
    );
  }

  revalidatePath("/teacher/courses");
  redirect(
    `/teacher/courses/${newCourseId}/edit?notice=${encodeURIComponent(
      "ทำสำเนาวิชาเรียบร้อยแล้ว กรอกห้องเรียนและตรวจสอบข้อมูลอีกครั้ง",
    )}`,
  );
}
