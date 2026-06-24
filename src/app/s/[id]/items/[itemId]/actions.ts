"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { STUDENT_SESSION_COOKIE, verifySessionToken } from "@/lib/student-session";
import {
  ASSIGNMENT_SUBMISSIONS_BUCKET,
  buildSubmissionPath,
  isAllowedSubmissionFile,
} from "@/lib/assignment-submission";
import { recomputeItemXp, recomputeStreakBonuses } from "@/lib/xp";

type ItemOwnershipRow = {
  id: string;
  score_categories: { course_id: string; courses: { owner_id: string } | null } | null;
};

// อัปโหลด/ส่งงานใหม่ทับของเดิม (resubmit) — ใช้ service client เพราะนักเรียนไม่มี Supabase Auth
// (ไม่มี auth.uid() ให้ RLS เช็ค) ต้อง manual-scope เงื่อนไขทุกขั้นเอง (session + enrollment + item ownership)
export async function submitAssignment(formData: FormData) {
  const courseId = formData.get("courseId") as string;
  const itemId = formData.get("itemId") as string;
  const file = formData.get("file") as File | null;
  const pagePath = `/s/${courseId}/items/${itemId}`;

  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) redirect(`/s/${courseId}`);

  if (!file || file.size === 0) {
    redirect(`${pagePath}?error=${encodeURIComponent("กรุณาเลือกไฟล์ที่จะส่ง")}`);
  }

  const validation = isAllowedSubmissionFile(file);
  if (!validation.ok) {
    redirect(`${pagePath}?error=${encodeURIComponent(validation.error)}`);
  }

  const supabase = createServiceClient();

  const { data: enrollment } = await supabase
    .from("course_students")
    .select("student_id")
    .eq("course_id", courseId)
    .eq("student_id", session.studentId)
    .maybeSingle();

  if (!enrollment) redirect(`/s/${courseId}`);

  const { data: item } = await supabase
    .from("grade_items")
    .select("id, score_categories(course_id, courses(owner_id))")
    .eq("id", itemId)
    .maybeSingle<ItemOwnershipRow>();

  if (!item || item.score_categories?.course_id !== courseId || !item.score_categories.courses) {
    redirect(`/s/${courseId}`);
  }

  const ownerId = item.score_categories.courses.owner_id;

  // ลบไฟล์เดิมก่อนถ้ามี (resubmit ทับของเดิม ไม่เก็บไฟล์ขยะซ้อนใน Storage)
  const { data: existing } = await supabase
    .from("assignment_submissions")
    .select("file_path")
    .eq("grade_item_id", itemId)
    .eq("student_id", session.studentId)
    .maybeSingle();

  if (existing) {
    await supabase.storage.from(ASSIGNMENT_SUBMISSIONS_BUCKET).remove([existing.file_path]);
  }

  const path = buildSubmissionPath({
    ownerId,
    courseId,
    itemId,
    studentId: session.studentId,
    fileName: file.name,
  });

  const { error: uploadError } = await supabase.storage
    .from(ASSIGNMENT_SUBMISSIONS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });

  if (uploadError) {
    redirect(`${pagePath}?error=${encodeURIComponent("อัปโหลดไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง")}`);
  }

  const { error: upsertError } = await supabase.from("assignment_submissions").upsert(
    {
      grade_item_id: itemId,
      student_id: session.studentId,
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "grade_item_id,student_id" },
  );

  if (upsertError) {
    redirect(`${pagePath}?error=${encodeURIComponent(upsertError.message)}`);
  }

  await recomputeItemXp(supabase, { gradeItemId: itemId, studentId: session.studentId });
  await recomputeStreakBonuses(supabase, { courseId, studentId: session.studentId });

  revalidatePath(pagePath);
  revalidatePath(`/s/${courseId}`);
  redirect(`${pagePath}?notice=${encodeURIComponent("ส่งงานเรียบร้อยแล้ว")}`);
}
