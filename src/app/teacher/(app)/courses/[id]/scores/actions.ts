"use server";

import { createClient } from "@/lib/supabase/server";

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
}
