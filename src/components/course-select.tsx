"use client";

import { useRouter } from "next/navigation";

export function CourseSelect({
  courses,
  value,
  basePath,
}: {
  courses: { id: string; name: string; code: string }[];
  value: string;
  basePath: string;
}) {
  const router = useRouter();

  return (
    <select
      value={value}
      onChange={(e) => router.push(`${basePath}?course=${e.target.value}`)}
      className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium outline-none focus:border-[var(--primary)]"
    >
      {courses.map((c) => (
        <option key={c.id} value={c.id}>
          {c.code} · {c.name}
        </option>
      ))}
    </select>
  );
}
