import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { CopyableSecret } from "@/components/copyable-secret";

export default async function CourseSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, code, name")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const link = `${protocol}://${host}/s/${courseId}`;

  const qrDataUrl = await QRCode.toDataURL(link, { margin: 1, width: 240 });

  return (
    <div className="max-w-md">
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">แชร์ลิงก์เข้าดูคะแนน</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        {course.code} · {course.name}
      </p>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR Code สำหรับเข้าดูคะแนน" className="h-60 w-60" />
        <p className="text-center text-sm text-[var(--muted)]">
          ให้นักเรียนสแกน QR หรือเปิดลิงก์นี้ เพื่อกรอกรหัสนักเรียน + PIN เข้าดูคะแนน
        </p>
        <CopyableSecret value={link} />
      </div>

      <Link
        href={`/teacher/courses/${courseId}/students`}
        className="mt-4 inline-block text-sm text-[var(--muted)]"
      >
        ← กลับไปหน้านักเรียน
      </Link>
    </div>
  );
}
