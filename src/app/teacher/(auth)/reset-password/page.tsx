import Link from "next/link";
import { KeyRound, Lock, Mail } from "lucide-react";
import { AuthBackgroundDecor } from "@/components/auth-background-decor";
import { IconInput } from "@/components/icon-input";
import { Logo } from "@/components/logo";
import { LoginIllustration } from "@/components/login-illustration";
import { PasswordInput } from "@/components/password-input";
import { resetPasswordWithOtp } from "@/app/teacher/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  const { email, error } = await searchParams;

  return (
    <main className="relative flex flex-1 flex-col bg-slate-50">
      <AuthBackgroundDecor />

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Logo />
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
          <LoginIllustration />

          <h1 className="mt-5 text-center text-xl font-bold text-[var(--primary-dark)]">
            ตั้งรหัสผ่านใหม่
          </h1>
          <p className="mt-2 text-center text-sm text-[var(--muted)]">
            กรอกรหัส OTP 6 หลักที่ส่งไปทางอีเมล พร้อมตั้งรหัสผ่านใหม่
          </p>

          {error && (
            <p className="mt-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-center text-sm text-red-700">
              {error}
            </p>
          )}

          <form action={resetPasswordWithOtp} className="mt-6 flex flex-col gap-3">
            <IconInput
              icon={Mail}
              type="email"
              name="email"
              defaultValue={email}
              required
              placeholder="อีเมล"
            />
            <IconInput
              icon={KeyRound}
              type="text"
              name="otp"
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="รหัส OTP 6 หลัก"
            />
            <PasswordInput icon={<Lock />} name="password" required placeholder="รหัสผ่านใหม่" />
            <PasswordInput
              icon={<Lock />}
              name="confirmPassword"
              required
              placeholder="ยืนยันรหัสผ่านใหม่"
            />

            <button
              type="submit"
              className="mt-2 w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
            >
              บันทึกรหัสผ่านใหม่
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            ไม่ได้รับรหัส?{" "}
            <Link href="/teacher/forgot-password" className="font-medium text-[var(--primary)]">
              ขอรหัสใหม่
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
