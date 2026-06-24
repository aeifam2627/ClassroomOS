"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

// ค้นหาแบบ debounce ไม่ต้องกด Enter — เปลี่ยน query string แล้วให้ Server Component ดึงข้อมูลใหม่
// เลือกปีการศึกษาอัปเดตทันที (ไม่ต้อง debounce เพราะเป็นการเลือก ไม่ใช่การพิมพ์)
export function CourseFilters({
  defaultQuery,
  defaultYear,
  yearOptions,
}: {
  defaultQuery?: string;
  defaultYear?: string;
  yearOptions: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery ?? "");
  const [year, setYear] = useState(defaultYear ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateUrl(nextQuery: string, nextYear: string) {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextYear) params.set("year", nextYear);
    router.replace(`/teacher/courses${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateUrl(value, year), 400);
  }

  function handleYearChange(value: string) {
    setYear(value);
    updateUrl(query, value);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative max-w-xs flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="ค้นหารหัสวิชา, ชื่อวิชา..."
          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white py-2.5 pr-4 pl-10 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
        />
      </div>
      <select
        value={year}
        onChange={(e) => handleYearChange(e.target.value)}
        className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
      >
        <option value="">ทุกปีการศึกษา</option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            ปีการศึกษา {y}
          </option>
        ))}
      </select>
    </div>
  );
}
