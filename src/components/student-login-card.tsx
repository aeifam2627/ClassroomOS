import { HelpCircle, Lock, User } from "lucide-react";
import { AuthBackgroundDecor } from "@/components/auth-background-decor";
import { IconInput } from "@/components/icon-input";
import { Logo } from "@/components/logo";
import { LoginIllustration } from "@/components/login-illustration";
import { PasswordInput } from "@/components/password-input";

// เทมเพลตเดียวกับหน้า login ของครู (`/teacher/login`) — ต่างกันแค่ฟอร์มด้านในและ subtitle
export function StudentLoginCard({
  action,
  subtitle,
  error,
  hiddenFields,
}: {
  action: (formData: FormData) => void;
  subtitle: string;
  error?: string;
  hiddenFields?: Record<string, string>;
}) {
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
            ตรวจสอบคะแนนของคุณ
          </h1>
          <p className="mt-1 text-center text-sm text-[var(--muted)]">{subtitle}</p>

          {error && (
            <p className="mt-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-center text-sm text-red-700">
              {error}
            </p>
          )}

          <form action={action} className="mt-6 flex flex-col gap-3">
            {hiddenFields &&
              Object.entries(hiddenFields).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))}
            <IconInput
              icon={User}
              name="studentCode"
              required
              autoComplete="off"
              inputMode="numeric"
              placeholder="รหัสนักเรียน"
            />
            <PasswordInput
              icon={<Lock />}
              name="pin"
              required
              autoComplete="off"
              inputMode="numeric"
              maxLength={6}
              placeholder="PIN (4-6 หลัก)"
            />

            <button
              type="submit"
              className="mt-2 w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
            >
              ดูคะแนน
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            ติดต่อครูผู้สอนหากลืมรหัสนักเรียนหรือ PIN
          </p>
        </div>
      </div>
    </main>
  );
}
