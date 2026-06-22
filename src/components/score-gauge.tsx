export function ScoreGauge({
  total,
  size = 176,
  ringColor,
}: {
  total: number;
  size?: number;
  ringColor: string;
}) {
  const angle = (Math.min(100, Math.max(0, total)) / 100) * 360;
  const gradient = `conic-gradient(${ringColor} 0deg ${angle}deg, #E2E8F0 ${angle}deg 360deg)`;
  const ringWidth = Math.round(size * 0.12);

  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{ width: size, height: size, background: gradient }}
    >
      <div
        className="absolute flex flex-col items-center justify-center rounded-full bg-white"
        style={{ inset: ringWidth }}
      >
        <span
          className="font-bold text-[var(--primary-dark)]"
          style={{ fontSize: size * 0.22 }}
        >
          {total.toFixed(1)}
        </span>
        <span className="text-[10px] text-[var(--muted)]">/100</span>
      </div>
    </div>
  );
}
