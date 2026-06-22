"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { FormField } from "@/components/form-field";
import { FormTextarea } from "@/components/form-textarea";
import { FormSelect } from "@/components/form-select";

type Row = { key: string; title: string; description: string; maxScore: string; chapterId: string };

function newRow(key: string): Row {
  return { key, title: "", description: "", maxScore: "", chapterId: "" };
}

export function MultiGradeItemForm({
  action,
  courseId,
  categoryId,
  chapters,
}: {
  action: (formData: FormData) => void;
  courseId: string;
  categoryId: string;
  chapters: { id: string; name: string }[];
}) {
  // แถวแรกต้อง key คงที่ ("row-0") ไม่ใช่ crypto.randomUUID() เพราะ useState initializer
  // รันทั้งตอน server render และตอน client hydrate คนละรอบ ได้ค่าสุ่มไม่ตรงกัน ทำให้ hydration mismatch
  // (ปุ่ม "เพิ่มชิ้นงาน" ใช้ randomUUID ได้ปลอดภัยเพราะรันแค่ฝั่ง client ตอนคลิกเท่านั้น ไม่มี SSR เกี่ยวข้อง)
  const [rows, setRows] = useState<Row[]>(() => [newRow("row-0")]);

  function updateRow(key: string, field: keyof Omit<Row, "key">, value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
    >
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="rowKeys" value={rows.map((r) => r.key).join(",")} />

      {rows.map((row, index) => (
        <div key={row.key} className="rounded-[var(--radius)] border border-[var(--border)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted)]">ชิ้นงานที่ {index + 1}</span>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="text-[var(--muted)] hover:text-red-500"
                aria-label="ลบแถวนี้"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <FormField
              label="ชื่อชิ้นงาน"
              name={`title-${row.key}`}
              placeholder="เช่น แบบฝึกหัดบทที่ 1"
              value={row.title}
              onChange={(e) => updateRow(row.key, "title", e.target.value)}
            />
            <FormTextarea
              label="รายละเอียดชิ้นงาน"
              name={`description-${row.key}`}
              required={false}
              placeholder="คืออะไร ให้นักเรียนทำอะไร"
              value={row.description}
              onChange={(e) => updateRow(row.key, "description", e.target.value)}
            />
            <FormField
              label="คะแนนเต็ม"
              name={`maxScore-${row.key}`}
              type="number"
              min={0.01}
              step={0.01}
              value={row.maxScore}
              onChange={(e) => updateRow(row.key, "maxScore", e.target.value)}
            />
            {chapters.length > 0 && (
              <FormSelect
                label="บท"
                name={`chapter-${row.key}`}
                placeholder="ไม่ระบุบท"
                options={chapters.map((c) => ({ value: c.id, label: c.name }))}
                value={row.chapterId}
                onChange={(e) => updateRow(row.key, "chapterId", e.target.value)}
              />
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, newRow(crypto.randomUUID())])}
        className="flex items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--border)] py-2.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/5"
      >
        <Plus className="h-4 w-4" />
        เพิ่มชิ้นงาน
      </button>

      <button
        type="submit"
        className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
      >
        บันทึกทั้งหมด ({rows.length} ชิ้นงาน)
      </button>
    </form>
  );
}
