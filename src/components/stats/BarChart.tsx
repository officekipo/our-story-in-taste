// src/components/stats/BarChart.tsx
"use client";
import { useState, useEffect } from "react";

const barColor = (cnt: number, max: number) => {
  const r = cnt / max;
  if (r >= 0.8) return "#3D7A5C";
  if (r >= 0.6) return "#4D8F6C";
  if (r >= 0.4) return "#6B9E7E";
  if (r >= 0.2) return "#8DC4A4";
  return "#B8DFC8";
};

interface BarChartProps {
  months:   string[];
  byMonth:  Record<string, number>;
  monthAvg: string;
}

export function BarChart({ months, byMonth, monthAvg }: BarChartProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  const maxVal = Math.max(...months.map(m => byMonth[m] ?? 0), 1);

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>📈</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1412" }}>월별 데이트 기록</span>
      </div>
      <p style={{ fontSize: 13, color: "#8A8078", marginBottom: 16 }}>
        매달 평균 <span style={{ fontWeight: 700, color: "#C96B52" }}>{monthAvg}회</span> 데이트를 했어요!
      </p>
      {months.length > 0 ? (
        <>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
            {months.map((m, mi) => {
              const cnt = byMonth[m] ?? 0;
              const h   = ready ? Math.max(16, Math.round((cnt / maxVal) * 88)) : 0;
              return (
                <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: barColor(cnt, maxVal) }}>{cnt}</span>
                  <div style={{ width: "100%", height: h, background: barColor(cnt, maxVal), borderRadius: "5px 5px 0 0", transition: `height ${0.4 + mi * 0.07}s cubic-bezier(.34,1.56,.64,1)` }} />
                  <div style={{ fontSize: 10, color: "#8A8078" }}>{m.slice(5)}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            {[["적음", "#B8DFC8"], ["보통", "#6B9E7E"], ["많음", "#3D7A5C"]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                <span style={{ fontSize: 10, color: "#8A8078" }}>{l}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "28px 0", color: "#C0B8B0" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
          <p style={{ fontSize: 13 }}>아직 월별 데이터가 없어요</p>
        </div>
      )}
    </div>
  );
}
