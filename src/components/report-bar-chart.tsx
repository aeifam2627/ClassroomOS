const BAR_MAX_PX = 110;

export function ReportBarChart({ data }: { data: { gradeLetter: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-[var(--muted)]">ยังไม่มีเกณฑ์การให้คะแนน</p>;
  }

  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((d) => (
        <div key={d.gradeLetter} className="flex flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-xs font-medium text-[var(--foreground)]">{d.count}</span>
          <div
            className="w-full rounded-t-[4px] bg-[var(--primary)]"
            style={{ height: `${Math.max(2, (d.count / maxCount) * BAR_MAX_PX)}px` }}
          />
          <span className="text-xs text-[var(--muted)]">{d.gradeLetter}</span>
        </div>
      ))}
    </div>
  );
}
