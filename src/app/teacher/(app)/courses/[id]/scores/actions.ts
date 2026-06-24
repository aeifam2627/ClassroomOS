"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ASSIGNMENT_SUBMISSIONS_BUCKET } from "@/lib/assignment-submission";
import { recomputeItemXp, recomputeStreakBonuses } from "@/lib/xp";

// บันทึกคะแนนรายช่อง เรียกตรงจาก client component (ไม่ใช่ <form> action) เพราะเป็น autosave ทีละเซลล์
// ไม่เรียก revalidatePath เพราะ ScoreGrid เก็บ state เองฝั่ง client อยู่แล้ว เพื่อเลี่ยงหน้ากระพริบ/รีเซ็ตค่าที่กำลังพิมพ์
export async function saveScore({
  gradeItemId,
  studentId,
  score,
}: {
  gradeItemId: string;
  studentId: string;
  score: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่ได้เข้าสู่ระบบ");

  const { error } = await supabase.from("student_scores").upsert(
    {
      grade_item_id: gradeItemId,
      student_id: studentId,
      score,
      status: score === null ? "pending" : "graded",
      updated_by: user.id,
    },
    { onConflict: "grade_item_id,student_id" },
  );

  if (error) throw new Error(error.message);

  await recomputeItemXp(supabase, { gradeItemId, studentId, knownScore: score });
}

// ลบไฟล์ที่นักเรียนส่งมา (ไฟล์ผิด/อยากให้ส่งใหม่) — ลบ row ด้วย client ปกติ (RLS เช็คความเป็นเจ้าของวิชาอยู่แล้ว
// จาก policy assignment_submissions_owner_delete) แล้วลบไฟล์จริงใน Storage ด้วย service client คู่กัน
export async function deleteSubmission(formData: FormData) {
  const courseId = formData.get("courseId") as string;
  const submissionId = formData.get("submissionId") as string;

  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("assignment_submissions")
    .select("file_path, grade_item_id, student_id")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) throw new Error("ไม่พบไฟล์ที่ส่งมา หรือไม่มีสิทธิ์ลบ");

  const { error } = await supabase.from("assignment_submissions").delete().eq("id", submissionId);
  if (error) throw new Error(error.message);

  const serviceClient = createServiceClient();
  await serviceClient.storage.from(ASSIGNMENT_SUBMISSIONS_BUCKET).remove([submission.file_path]);

  // ลบการส่งงานทิ้งแล้ว XP ที่ได้จากพฤติกรรมส่ง (และ streak ที่อาจพึ่งชิ้นนี้) ต้อง recompute ตาม ไม่งั้นค้างเป็นค่าเก่าที่ผิด
  await recomputeItemXp(supabase, { gradeItemId: submission.grade_item_id, studentId: submission.student_id });
  await recomputeStreakBonuses(supabase, { courseId, studentId: submission.student_id });

  revalidatePath(`/teacher/courses/${courseId}/scores`);
}
