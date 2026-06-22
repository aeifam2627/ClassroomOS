const WIDTH = 600;
const HEIGHT = 160;
const PADDING = 20;

export function ReportLineChart({ data }: { data: { index: number; title: string; avgPercent: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-[var(--muted)]">ยังไม่มีชิ้นงาน</p>;
  }

  const innerWidth = WIDTH - PADDING * 2;
  const innerHeight = HEIGHT - PADDING * 2;

  function pointAt(i: number, percent: number) {
    const x = data.length === 1 ? WIDTH / 2 : PADDING + (i / (data.length - 1)) * innerWidth;
    const y = PADDING + innerHeight - (Math.min(100, Math.max(0, percent)) / 100) * innerHeight;
    return { x, y };
  }

  const points = data.map((d, i) => pointAt(i, d.avgPercent));
  const path = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" preserveAspectRatio="none">
        <polyline
          points={path}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--primary)">
            <title>
              {data[i].title}: {data[i].avgPercent.toFixed(1)}%
            </title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-[var(--muted)]">
        {data.length <= 8 ? (
          data.map((d) => <span key={d.index}>ชิ้นงาน {d.index}</span>)
        ) : (
          <>
            <span>ชิ้นงาน {data[0].index}</span>
            <span>ชิ้นงาน {data[data.length - 1].index}</span>
          </>
        )}
      </div>
    </div>
  );
}
