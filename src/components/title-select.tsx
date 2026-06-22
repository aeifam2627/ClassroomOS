import { STUDENT_TITLES } from "@/lib/student-title";

export function TitleSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      คำนำหน้า
      <select
        name="title"
        defaultValue={defaultValue ?? "ไม่ระบุ"}
        className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
      >
        {STUDENT_TITLES.map((title) => (
          <option key={title} value={title}>
            {title}
          </option>
        ))}
      </select>
    </label>
  );
}
