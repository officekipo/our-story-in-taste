// src/components/stats/RegionPieChart.tsx
"use client";
import { useState } from "react";
import type { VisitedRecord } from "@/types";

const PIE_COLORS = ["#6B9E7E", "#E8A77A", "#7AB8D4", "#A8B8E0", "#C0B8B0"];
// 마지막 색은 "기타" 전용 (회색 계열)

export function RegionPieChart({ visited }: { visited: VisitedRecord[] }) {
  const [expanded, setExpanded] = useState(false);

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

  // 전체 지역 카운트
  const counts = visited.reduce((acc, r) => {
    const key = r.district ? `${r.sido} ${r.district}` : r.sido;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 전체 순위 정렬
  const allRegions = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  // 파이: 상위 4개 + 기타 합산
  const top4      = allRegions.slice(0, 4);
  const etcCount  = allRegions.slice(4).reduce((s, [, c]) => s + c, 0);
  const pieData   = etcCount > 0
    ? [...top4, ["기타", etcCount] as [string, number]]
    : top4;

  // 파이 슬라이스 계산
  const R = 72, cx = 108, cy = 108, ir = 40;
  let angle = -90;
  const slices = pieData.map(([label, cnt], i) => {
    const ratio = cnt / total;
    const end   = angle + ratio * 360;
    const toR   = (d: number) => d * Math.PI / 180;
    const large = ratio > 0.5 ? 1 : 0;
    const x1 = cx + R * Math.cos(toR(angle));
    const y1 = cy + R * Math.sin(toR(angle));
    const x2 = cx + R * Math.cos(toR(end));
    const y2 = cy + R * Math.sin(toR(end));
    const pathD = `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} Z`;

    // 라벨 위치: 슬라이스 중간각
    const mid = angle + ratio * 180;
    const labelR = R + 20;
    const lx = cx + labelR * Math.cos(toR(mid));
    const ly = cy + labelR * Math.sin(toR(mid));

    angle = end;
    return {
      d: pathD,
      color: PIE_COLORS[i],
      label,
      cnt,
      lx,
      ly,
      pct: Math.round(ratio * 100),
      ratio,
    };
  });

  // 리스트 표시 개수
  const PREVIEW = 5;
  const visibleRegions = expanded ? allRegions : allRegions.slice(0, PREVIEW);
  const hasMore = allRegions.length > PREVIEW;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>📍</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1412" }}>가장 많이 간 지역</span>
      </div>
      <p style={{ fontSize: 13, color: "#8A8078", marginBottom: 14 }}>
        우리의 단골 동네는{" "}
        <span style={{ fontWeight: 700, color: "#C96B52" }}>{allRegions[0][0]}</span>
      </p>

      {/* 파이 차트 */}
      <svg
        viewBox="0 0 216 216"
        style={{ width: "100%", maxWidth: 216, display: "block", margin: "0 auto" }}
      >
        {slices.map((s, i) => (
          <path
            key={i}
            d={s.d}
            fill={s.color}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}

        {/* 도넛 구멍 */}
        <circle cx={cx} cy={cy} r={ir} fill="#fff" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fill="#8A8078" fontFamily="inherit">방문</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="18" fill="#1A1412" fontWeight="800" fontFamily="inherit">{total}</text>

        {/* 슬라이스 라벨 - 퍼센트만 표시 (겹침 방지) */}
        {slices.map((s, i) => {
          // 너무 작은 슬라이스는 라벨 생략
          if (s.ratio < 0.06) return null;
          return (
            <text
              key={"l" + i}
              x={s.lx}
              y={s.ly}
              textAnchor="middle"
              fontSize="9"
              fill={s.color}
              fontWeight="700"
              fontFamily="inherit"
            >
              {s.pct}%
            </text>
          );
        })}
      </svg>

      {/* 파이 범례 (top4 + 기타) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", margin: "12px 0 16px" }}>
        {pieData.map(([label, cnt], i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i], flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#8A8078" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: "#F0EBE3", marginBottom: 12 }} />

      {/* 전체 지역 순위 리스트 */}
      <div>
        {visibleRegions.map(([label, cnt], i) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 0",
              borderBottom: i < visibleRegions.length - 1 ? "1px solid #F5F0EB" : "none",
            }}
          >
            {/* 순위 번호 */}
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: i < 4 ? PIE_COLORS[i] + "22" : "#F5F0EB",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: i < 4 ? PIE_COLORS[i] : "#C0B8B0",
              }}>
                {i + 1}
              </span>
            </div>

            {/* 색상 점 */}
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: i < PIE_COLORS.length - 1 ? PIE_COLORS[i] : "#C0B8B0",
              flexShrink: 0,
            }} />

            <span style={{ flex: 1, fontSize: 12, color: "#1A1412" }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1412" }}>{cnt}회</span>
            <span style={{ fontSize: 11, color: "#C0B8B0", minWidth: 36, textAlign: "right" }}>
              ({Math.round(cnt / total * 100)}%)
            </span>
          </div>
        ))}
      </div>

      {/* 더보기 / 접기 버튼 */}
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "9px 0",
            background: "#FAF7F3",
            border: "none",
            borderRadius: 10,
            fontSize: 12,
            color: "#8A8078",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            fontFamily: "inherit",
          }}
        >
          {expanded ? (
            <>접기 <span style={{ fontSize: 10 }}>▲</span></>
          ) : (
            <>전체 {allRegions.length}개 지역 보기 <span style={{ fontSize: 10 }}>▼</span></>
          )}
        </button>
      )}
    </div>
  );
}
