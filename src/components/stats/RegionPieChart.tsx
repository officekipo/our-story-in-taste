// src/components/stats/RegionPieChart.tsx
//
//  Fix / Add:
//    ★ 재방문 포함 총 방문 횟수로 지역별 집계 (visits 배열 길이 반영)
//    ★ 리스트에 "장소 N곳 · 총 N회" 형태로 방문 횟수 노출
//    기존: 레코드 수(맛집 수)만 카운트 → 변경: 총 방문 횟수 카운트
"use client";
import { useState } from "react";
import type { VisitedRecord } from "@/types";

const PIE_COLORS = ["#6B9E7E", "#E8A77A", "#7AB8D4", "#A8B8E0", "#C0B8B0"];

// ★ 레코드 한 건의 총 방문 횟수 (최초 1 + visits 배열)
function getTotalVisits(r: VisitedRecord): number {
  return 1 + (r.visits?.length ?? 0);
}

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

  // ★ 지역별 집계: 장소 수(places) + 총 방문 횟수(visits)
  const regionMap = visited.reduce((acc, r) => {
    const key = r.district ? `${r.sido} ${r.district}` : r.sido;
    if (!acc[key]) acc[key] = { places: 0, visits: 0 };
    acc[key].places += 1;
    acc[key].visits += getTotalVisits(r);
    return acc;
  }, {} as Record<string, { places: number; visits: number }>);

  // 총 방문 횟수 기준으로 정렬
  const allRegions = Object.entries(regionMap).sort((a, b) => b[1].visits - a[1].visits);

  // 파이차트용: 총 방문 횟수 합계
  const totalVisitCount = allRegions.reduce((s, [, v]) => s + v.visits, 0);

  // 파이: 상위 4개 + 기타 합산 (방문 횟수 기준)
  const top4      = allRegions.slice(0, 4);
  const etcVisits = allRegions.slice(4).reduce((s, [, v]) => s + v.visits, 0);
  const pieData: Array<[string, number]> = etcVisits > 0
    ? [...top4.map(([k, v]) => [k, v.visits] as [string, number]), ["기타", etcVisits]]
    : top4.map(([k, v]) => [k, v.visits] as [string, number]);

  // 파이 슬라이스 계산
  const R = 72, cx = 108, cy = 108, ir = 40;
  let angle = -90;
  const slices = pieData.map(([label, cnt], i) => {
    const ratio = cnt / totalVisitCount;
    const end   = angle + ratio * 360;
    const toR   = (d: number) => d * Math.PI / 180;
    const large = ratio > 0.5 ? 1 : 0;
    const x1 = cx + R * Math.cos(toR(angle));
    const y1 = cy + R * Math.sin(toR(angle));
    const x2 = cx + R * Math.cos(toR(end));
    const y2 = cy + R * Math.sin(toR(end));
    const pathD = `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} Z`;
    const mid = angle + ratio * 180;
    const labelR = R + 20;
    const lx = cx + labelR * Math.cos(toR(mid));
    const ly = cy + labelR * Math.sin(toR(mid));
    angle = end;
    return { d: pathD, color: PIE_COLORS[i], label, cnt, lx, ly, pct: Math.round(ratio * 100), ratio };
  });

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
        {"  "}
        <span style={{ fontSize: 11, color: "#C0B8B0" }}>(총 {totalVisitCount}회 방문)</span>
      </p>

      {/* 파이 차트 */}
      <svg viewBox="0 0 216 216" style={{ width: "100%", maxWidth: 216, display: "block", margin: "0 auto" }}>
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} stroke="#fff" strokeWidth="2" />
        ))}
        {/* 도넛 구멍 */}
        <circle cx={cx} cy={cy} r={ir} fill="#fff" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fill="#8A8078" fontFamily="inherit">총 방문</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="18" fill="#1A1412" fontWeight="800" fontFamily="inherit">{totalVisitCount}</text>
        {/* 슬라이스 라벨 */}
        {slices.map((s, i) => {
          if (s.ratio < 0.06) return null;
          return (
            <text key={"l" + i} x={s.lx} y={s.ly} textAnchor="middle" fontSize="9" fill={s.color} fontWeight="700" fontFamily="inherit">
              {s.pct}%
            </text>
          );
        })}
      </svg>

      {/* 파이 범례 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", margin: "12px 0 16px" }}>
        {pieData.map(([label], i) => (
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
        {visibleRegions.map(([label, data], i) => {
          const hasRevisit = data.visits > data.places;
          return (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < visibleRegions.length - 1 ? "1px solid #F5F0EB" : "none" }}
            >
              {/* 순위 번호 */}
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: i < 4 ? PIE_COLORS[i] + "22" : "#F5F0EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: i < 4 ? PIE_COLORS[i] : "#C0B8B0" }}>{i + 1}</span>
              </div>
              {/* 색상 점 */}
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: i < PIE_COLORS.length - 1 ? PIE_COLORS[i] : "#C0B8B0", flexShrink: 0 }} />
              {/* 지역명 */}
              <span style={{ flex: 1, fontSize: 12, color: "#1A1412" }}>{label}</span>
              {/* ★ 장소 수 + 총 방문 횟수 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1412" }}>{data.visits}회</span>
                  {hasRevisit && (
                    <span style={{ fontSize: 10, color: "#C96B52", background: "#F2D5CC", borderRadius: 8, padding: "1px 5px", fontWeight: 700 }}>🔁</span>
                  )}
                </div>
                <span style={{ fontSize: 10, color: "#C0B8B0" }}>{data.places}곳</span>
              </div>
              <span style={{ fontSize: 11, color: "#C0B8B0", minWidth: 36, textAlign: "right" }}>({Math.round(data.visits / totalVisitCount * 100)}%)</span>
            </div>
          );
        })}
      </div>

      {/* 더보기 / 접기 */}
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ width: "100%", marginTop: 10, padding: "9px 0", background: "#FAF7F3", border: "none", borderRadius: 10, fontSize: 12, color: "#8A8078", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: "inherit" }}
        >
          {expanded ? <>접기 <span style={{ fontSize: 10 }}>▲</span></> : <>전체 {allRegions.length}개 지역 보기 <span style={{ fontSize: 10 }}>▼</span></>}
        </button>
      )}
    </div>
  );
}
