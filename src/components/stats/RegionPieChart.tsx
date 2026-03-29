import type { VisitedRecord } from "@/types";
const PIE_COLORS = ["#6B9E7E", "#E8A77A", "#7AB8D4", "#A8B8E0", "#D4A7D0"];
export function RegionPieChart({ visited }: { visited: VisitedRecord[] }) {
  const total = visited.length;
  if (total === 0)
    return (
      <div className="bg-white rounded-2xl p-4 mb-3.5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg"> </span>
          <span className="text-[15px] font-bold text-ink">
            가장 많이 간 지역
          </span>
        </div>
        <div className="text-center py-7 text-muted-mid text-sm">
          기록이 없어요
        </div>
      </div>
    );
  /* 지역별 카운트 (sido + district) */
  const counts = visited.reduce(
    (acc, r) => {
      const key = r.district ? `${r.sido} ${r.district}` : r.sido;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  /* SVG 도넛 차트 슬라이스 계산 */
  const R = 72,
    cx = 108,
    cy = 108,
    ir = 40;
  let angle = -90;
  const slices = top.map(([label, cnt], i) => {
    const ratio = cnt / total;
    const end = angle + ratio * 360;
    const toR = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + R * Math.cos(toR(angle)),
      y1 = cy + R * Math.sin(toR(angle));
    const x2 = cx + R * Math.cos(toR(end)),
      y2 = cy + R * Math.sin(toR(end));
    const d = `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${ratio > 0.5 ? 1 : 0},1
${x2},${y2} Z`;
    const mid = angle + ratio * 180;
    const lx = cx + (R + 24) * Math.cos(toR(mid));
    const ly = cy + (R + 24) * Math.sin(toR(mid));
    angle = end;
    return {
      d,
      color: PIE_COLORS[i],
      label,
      cnt,
      lx,
      ly,
      pct: Math.round(ratio * 100),
    };
  });
  return (
    <div
      className="bg-white rounded-2xl p-4 mb-3.5 shadow-sm animate-fade-up"
      style={{ animationDelay: "0.2s" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg"> </span>
        <span className="text-[15px] font-bold text-ink">
          가장 많이 간 지역
        </span>
      </div>
      <p className="text-sm text-muted mb-4">
        우리의 단골 동네는{" "}
        <span className="font-bold textrose">{top[0][0]}</span>
      </p>
      {/* SVG 도넛 차트 */}
      <svg viewBox="0 0 216 216" className="w-full max-w-[216px] mx-auto block">
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth="2" />
        ))}
        <circle cx={cx} cy={cy} r={ir} fill="white" />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize="10"
          fill="#8A8078"
          fontFamily="Arial"
        >
          방문
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize="18"
          fill="#1A1412"
          fontWeight="800"
          fontFamily="Arial"
        >
          {total}
        </text>
        {slices.map((s, i) => (
          <g key={"l" + i}>
            <text
              x={s.lx}
              y={s.ly - 3}
              textAnchor="middle"
              fontSize="8"
              fill={s.color}
              fontWeight="600"
              fontFamily="Arial"
            >
              {s.label}
            </text>
            <text
              x={s.lx}
              y={s.ly + 8}
              textAnchor="middle"
              fontSize="8"
              fill="#8A8078"
              fontFamily="Arial"
            >
              {s.pct}%
            </text>
          </g>
        ))}
      </svg>
      {/* 범례 */}
      <div className="mt-3.5">
        {top.map(([label, cnt], i) => (
          <div key={label} className="flex items-center gap-2 mb-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                background: PIE_COLORS[i],
              }}
            />
            <span className="text-xs text-muted flex-1">{label}</span>
            <span className="text-xs font-semibold text-ink">{cnt}회</span>
            <span className="text-[11px] text-mutedmid">
              ({Math.round((cnt / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
