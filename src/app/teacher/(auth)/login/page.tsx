import Link from "next/link";
import { HelpCircle, Lock, Mail } from "lucide-react";
import { AuthBackgroundDecor } from "@/components/auth-background-decor";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { IconInput } from "@/components/icon-input";
import { Logo } from "@/components/logo";
import { LoginIllustration } from "@/components/login-illustration";
import { PasswordInput } from "@/components/password-input";
import { login } from "@/app/teacher/actions";

export default async function TeacherLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;

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
            เข้าสู่ระบบ (ครูผู้สอน)
          </h1>

          {notice && (
            <p className="mt-4 rounded-[var(--radius)] bg-[var(--primary)]/10 px-4 py-2 text-center text-sm text-[var(--primary-dark)]">
              {notice}
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-center text-sm text-red-700">
              {error}
            </p>
          )}

          <form action={login} className="mt-6 flex flex-col gap-3">
            <IconInput icon={Mail} type="email" name="email" required placeholder="อีเมล" />
            <PasswordInput icon={<Lock />} name="password" required placeholder="รหัสผ่าน" />

            <button
              type="submit"
              className="mt-2 w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
            >
              เข้าสู่ระบบ
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link href="/teacher/forgot-password" className="font-medium text-[var(--primary)]">
              ลืมรหัสผ่าน?
            </Link>
          </p>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs text-[var(--muted)]">หรือ</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <GoogleAuthButton label="เข้าสู่ระบบด้วย Google" />

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            ยังไม่มีบัญชี?{" "}
            <Link href="/teacher/signup" className="font-medium text-[var(--primary)]">
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
