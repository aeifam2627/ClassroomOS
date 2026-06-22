import Link from "next/link";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo />
      <p className="max-w-md text-[var(--muted)]">
        ระบบช่วยครูจัดการคะแนนนักเรียน และให้นักเรียนเช็คคะแนนตัวเองผ่านมือถือ
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/teacher/login"
          className="rounded-[var(--radius)] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
        >
          เข้าสู่ระบบครูผู้สอน
        </Link>
        <Link
          href="/s"
          className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-slate-50"
        >
          นักเรียนเข้าดูคะแนน
        </Link>
      </div>
    </main>
  );
}
