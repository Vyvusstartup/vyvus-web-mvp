'use client';

type Pt = { date: string; value: number | null };

export default function Sparkline({
  data,
  width = 180,
  height = 48,
  strokeWidth = 2,
  label = 'últimos 30 días',
}: {
  data: Pt[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const vals = data.map(d => (d.value == null ? null : Number(d.value)));
  const present = vals.filter(v => v != null) as number[];

  if (present.length < 2) {
    return (
      <div className="text-xs text-gray-500">
        {label}: sin datos suficientes
      </div>
    );
  }

  const min = Math.min(...present);
  const max = Math.max(...present);
  const pad = (max - min) === 0 ? 5 : (max - min) * 0.15;
  const yMin = min - pad;
  const yMax = max + pad;

  const points: [number, number, boolean][] = [];
  const n = data.length;
  for (let i = 0; i < n; i++) {
    const v = vals[i];
    const x = (i / (n - 1)) * (width - strokeWidth) + strokeWidth / 2;
    if (v == null) {
      points.push([x, 0, true]); // gap
    } else {
      const y = height - ((v - yMin) / (yMax - yMin)) * (height - strokeWidth) - strokeWidth / 2;
      points.push([x, y, false]);
    }
  }

  // construir path con cortes en nulos
  let d = '';
  for (let i = 0; i < points.length; i++) {
    const [x, y, gap] = points[i];
    if (gap) continue;
    // buscar si el anterior era gap
    const prevGap = i === 0 || points[i - 1][2];
    d += `${prevGap ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
  }

  return (
    <div className="flex flex-col items-end">
      <svg width={width} height={height} role="img" aria-label="Sparkline">
        <path d={d} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
        {/* punto final */}
        {(() => {
          for (let i = points.length - 1; i >= 0; i--) {
            const [x, y, gap] = points[i];
            if (!gap) return <circle key="dot" cx={x} cy={y} r={3} />;
          }
          return null;
        })()}
      </svg>
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}
