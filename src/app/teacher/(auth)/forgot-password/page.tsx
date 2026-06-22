import Link from "next/link";
import { HelpCircle, Mail } from "lucide-react";
import { AuthBackgroundDecor } from "@/components/auth-background-decor";
import { IconInput } from "@/components/icon-input";
import { Logo } from "@/components/logo";
import { LoginIllustration } from "@/components/login-illustration";
import { requestPasswordReset } from "@/app/teacher/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative flex flex-1 flex-col bg-slate-50">
      <AuthBackgroundDecor />

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Logo />
        <span className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
          <HelpCircle className="h-4 w-4" />
          ช่วยเหลือ
        </span>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
          <LoginIllustration />

          <h1 className="mt-5 text-center text-xl font-bold text-[var(--primary-dark)]">
            ลืมรหัสผ่าน
          </h1>
          <p className="mt-2 text-center text-sm text-[var(--muted)]">
            กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งรหัส OTP 6 หลักสำหรับตั้งรหัสผ่านใหม่ให้
          </p>

          {error && (
            <p className="mt-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-center text-sm text-red-700">
              {error}
            </p>
          )}

          <form action={requestPasswordReset} className="mt-6 flex flex-col gap-3">
            <IconInput icon={Mail} type="email" name="email" required placeholder="อีเมล" />

            <button
              type="submit"
              className="mt-2 w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
            >
              ส่งรหัส OTP
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            <Link href="/teacher/login" className="font-medium text-[var(--primary)]">
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
