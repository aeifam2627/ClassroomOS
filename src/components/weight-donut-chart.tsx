import { categoryHex } from "@/lib/category-color";

export function WeightDonutChart({
  categories,
}: {
  categories: { name: string; weight_percent: number }[];
}) {
  const total = categories.reduce((sum, c) => sum + c.weight_percent, 0);

  const boundaries = categories.reduce<number[]>(
    (acc, c) => [...acc, acc[acc.length - 1] + c.weight_percent],
    [0],
  );

  const stops = categories.map(
    (_, index) =>
      `${categoryHex(index)} ${(boundaries[index] / 100) * 360}deg ${(boundaries[index + 1] / 100) * 360}deg`,
  );

  const remaining = Math.max(0, 100 - total);
  if (remaining > 0) {
    const start = (boundaries[boundaries.length - 1] / 100) * 360;
    stops.push(`#E2E8F0 ${start}deg 360deg`);
  }

  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(", ")})` : "#E2E8F0";

  return (
    <div className="flex items-center gap-6">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full"
        style={{ background: gradient }}
      >
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-xs text-[var(--muted)]">รวม</span>
          <span className="text-lg font-bold text-[var(--primary-dark)]">{total}%</span>
        </div>
      </div>

      <ul className="flex flex-1 flex-col gap-2">
        {categories.map((c, index) => (
          <li key={c.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: categoryHex(index) }}
              />
              {c.name}
            </span>
            <span className="font-medium text-[var(--foreground)]">{c.weight_percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
