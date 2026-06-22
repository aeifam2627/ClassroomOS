import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { PasswordInput } from "@/components/password-input";
import { signup } from "@/app/teacher/actions";

export default async function TeacherSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell>
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">
        สร้างบัญชีครูผู้สอน
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        เริ่มต้นใช้งาน ClassScore เพื่อยกระดับการสอนของคุณ
      </p>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={signup} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          required
          placeholder="ชื่อ-นามสกุล"
          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
        />
        <input
          type="email"
          name="email"
          required
          placeholder="อีเมล"
          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
        />
        <PasswordInput name="password" required minLength={8} placeholder="รหัสผ่าน" />
        <PasswordInput
          name="confirmPassword"
          required
          minLength={8}
          placeholder="ยืนยันรหัสผ่าน"
        />

        <label className="mt-1 flex items-start gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            name="termsAccepted"
            required
            className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/20"
          />
          ฉันยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว
        </label>

        <button
          type="submit"
          className="mt-2 w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
        >
          สร้างบัญชี
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs text-[var(--muted)]">หรือ</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <GoogleAuthButton label="ลงทะเบียนด้วย Google" />

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/teacher/login" className="font-medium text-[var(--primary)]">
          เข้าสู่ระบบ
        </Link>
      </p>
    </AuthShell>
  );
}
