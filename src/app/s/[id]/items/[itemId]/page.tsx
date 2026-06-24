import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, FileText } from "lucide-react";
import { STUDENT_SESSION_COOKIE, verifySessionToken } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/service";
import { formatThaiDateTime } from "@/lib/due-date";
import { isLateSubmission } from "@/lib/assignment-submission";
import { SuccessPopup } from "@/components/success-popup";
import { SubmitAssignmentForm } from "@/components/submit-assignment-form";

type ItemRow = {
  id: string;
  title: string;
  description: string;
  max_score: number;
  due_at: string | null;
  score_categories: { course_id: string } | null;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function SubmitAssignmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; itemId: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id: courseId, itemId } = await params;
  const { error, notice } = await searchParams;

  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) redirect(`/s/${courseId}`);

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
    .select("id, title, description, max_score, due_at, score_categories(course_id)")
    .eq("id", itemId)
    .maybeSingle<ItemRow>();

  if (!item || item.score_categories?.course_id !== courseId) redirect(`/s/${courseId}`);

  const { data: submission } = await supabase
    .from("assignment_submissions")
    .select("file_name, file_size, submitted_at")
    .eq("grade_item_id", itemId)
    .eq("student_id", session.studentId)
    .maybeSingle();

  const late = submission ? isLateSubmission(submission.submitted_at, item.due_at) : false;

  return (
    <div className="max-w-xl">
      <p className="mb-1 text-sm text-[var(--muted)]">
        <Link href={`/s/${courseId}`} className="hover:underline">
          {"< กลับไปหน้าคะแนน"}
        </Link>
      </p>

      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">{item.title}</h1>
      {item.description && <p className="mb-4 text-sm text-[var(--muted)]">{item.description}</p>}

      {notice && <SuccessPopup message={notice} />}
      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-[var(--muted)]">
            คะแนนเต็ม {item.max_score}
          </span>
          {item.due_at && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
              <Clock3 className="h-3.5 w-3.5" />
              กำหนดส่ง {formatThaiDateTime(item.due_at)}
            </span>
          )}
        </div>

        {submission ? (
          <div
            className={`mb-4 flex items-center gap-3 rounded-[var(--radius)] border px-4 py-3 ${
              late ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <FileText className={`h-5 w-5 shrink-0 ${late ? "text-red-600" : "text-emerald-600"}`} />
            <div className="min-w-0">
              <p className={`truncate text-sm font-medium ${late ? "text-red-700" : "text-emerald-700"}`}>
                {submission.file_name}
              </p>
              <p className="text-xs text-[var(--muted)]">
                ส่งเมื่อ {formatThaiDateTime(submission.submitted_at)} · {formatFileSize(submission.file_size)}
                {late ? " · ส่งล่าช้า" : " · ส่งแล้ว"}
              </p>
            </div>
            <CheckCircle2
              className={`ml-auto h-5 w-5 shrink-0 ${late ? "text-red-500" : "text-emerald-500"}`}
            />
          </div>
        ) : (
          <p className="mb-4 text-sm text-[var(--muted)]">ยังไม่ได้ส่งงานนี้</p>
        )}

        <SubmitAssignmentForm
          courseId={courseId}
          itemId={itemId}
          dueAt={item.due_at}
          hasExistingSubmission={Boolean(submission)}
        />
      </div>
    </div>
  );
}
