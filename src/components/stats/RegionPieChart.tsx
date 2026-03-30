// src/components/stats/RegionPieChart.tsx
import type { VisitedRecord } from "@/types";

const PIE_COLORS = ["#6B9E7E", "#E8A77A", "#7AB8D4", "#A8B8E0", "#D4A7D0"];

export function RegionPieChart({ visited }: { visited: VisitedRecord[] }) {
  const total = visited.length;
  if (total === 0) return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>📍</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1412" }}>가장 많이 간 지역</span>
      </div>
      <p style={{ textAlign: "center", padding: "20px 0", color: "#C0B8B0", fontSize: 13 }}>기록이 없어요</p>
    </div>
  );

  const counts = visited.reduce((acc, r) => {
    const key = r.district ? `${r.sido} ${r.district}` : r.sido;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const R = 72, cx = 108, cy = 108, ir = 40;
  let angle = -90;
  const slices = top.map(([label, cnt], i) => {
    const ratio = cnt / total;
    const end   = angle + ratio * 360;
    const toR   = (d: number) => d * Math.PI / 180;
    const x1 = cx + R * Math.cos(toR(angle)), y1 = cy + R * Math.sin(toR(angle));
    const x2 = cx + R * Math.cos(toR(end)),   y2 = cy + R * Math.sin(toR(end));
    const d  = `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${ratio > 0.5 ? 1 : 0},1 ${x2},${y2} Z`;
    const mid = angle + ratio * 180;
    const lx  = cx + (R + 24) * Math.cos(toR(mid));
    const ly  = cy + (R + 24) * Math.sin(toR(mid));
    angle = end;
    return { d, color: PIE_COLORS[i], label, cnt, lx, ly, pct: Math.round(ratio * 100) };
  });

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>📍</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1412" }}>가장 많이 간 지역</span>
      </div>
      <p style={{ fontSize: 13, color: "#8A8078", marginBottom: 14 }}>
        우리의 단골 동네는 <span style={{ fontWeight: 700, color: "#C96B52" }}>{top[0][0]}</span>
      </p>
      <svg viewBox="0 0 216 216" style={{ width: "100%", maxWidth: 216, display: "block", margin: "0 auto" }}>
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="#fff" strokeWidth="2" />)}
        <circle cx={cx} cy={cy} r={ir} fill="#fff" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fill="#8A8078" fontFamily="inherit">방문</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="18" fill="#1A1412" fontWeight="800" fontFamily="inherit">{total}</text>
        {slices.map((s, i) => (
          <g key={"l" + i}>
            <text x={s.lx} y={s.ly - 3} textAnchor="middle" fontSize="8" fill={s.color} fontWeight="600" fontFamily="inherit">{s.label}</text>
            <text x={s.lx} y={s.ly + 8} textAnchor="middle" fontSize="8" fill="#8A8078" fontFamily="inherit">{s.pct}%</text>
          </g>
        ))}
      </svg>
      <div style={{ marginTop: 14 }}>
        {top.map(([label, cnt], i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: PIE_COLORS[i], flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#8A8078", flex: 1 }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1412" }}>{cnt}회</span>
            <span style={{ fontSize: 11, color: "#C0B8B0" }}>({Math.round(cnt / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
