import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FormField } from "@/components/form-field";
import { SuccessPopup } from "@/components/success-popup";
import { updateProfileName } from "./actions";

export default async function TeacherSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentName = (user?.user_metadata?.name as string | undefined) ?? "";

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">ตั้งค่าโปรไฟล์</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        แก้ไขชื่อที่แสดงในระบบ (ใช้ได้ทั้งบัญชีที่เข้าสู่ระบบด้วยอีเมลและ Google)
      </p>

      {notice && <SuccessPopup message={notice} />}
      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={updateProfileName}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
            <User className="h-5 w-5" />
          </span>
          <p className="text-sm text-[var(--muted)]">{user?.email}</p>
        </div>

        <FormField
          label="ชื่อที่แสดง"
          name="name"
          defaultValue={currentName}
          placeholder="เช่น ครูสมชาย ใจดี"
        />

        <div className="mt-2">
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            บันทึก
          </button>
        </div>
      </form>
    </div>
  );
}
