import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ASSIGNMENT_SUBMISSIONS_BUCKET } from "@/lib/assignment-submission";

// ตรวจสิทธิ์เจ้าของวิชาด้วย client ปกติก่อน (RLS select policy ของ assignment_submissions บล็อกอยู่แล้ว
// ถ้าไม่ใช่เจ้าของวิชา ได้ null กลับมา) แล้วค่อยใช้ service client สร้าง signed URL ให้ดาวน์โหลดไฟล์จริง
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> },
) {
  const { submissionId } = await params;

  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("assignment_submissions")
    .select("file_path")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) return NextResponse.json({ error: "ไม่พบไฟล์ที่ส่งมา" }, { status: 404 });

  const serviceClient = createServiceClient();
  const { data: signed, error } = await serviceClient.storage
    .from(ASSIGNMENT_SUBMISSIONS_BUCKET)
    .createSignedUrl(submission.file_path, 60);

  if (error || !signed) {
    return NextResponse.json({ error: "สร้างลิงก์ดาวน์โหลดไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
