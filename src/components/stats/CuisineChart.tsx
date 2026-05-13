// src/components/stats/CuisineChart.tsx
//
//  Fix / Add:
//    ★ 재방문 포함 총 방문 횟수로 음식 종류별 집계 (1 + visits.length)
//    ★ 재방문이 있는 음식 종류에 🔁 뱃지 표시
"use client";
import { useState, useEffect } from "react";
import type { VisitedRecord }  from "@/types";

const CUISINE_COLORS: Record<string, string> = {
  "한식": "#C96B52", "일식": "#6B9E9E", "중식": "#C4472B",
  "이탈리안": "#6B8E4A", "프랑스": "#7B6BAE", "멕시칸": "#D4956A",
  "브런치": "#E8A77A", "카페/디저트": "#C96B8A", "해산물": "#4A90C4",
  "패스트푸드": "#E8C020", "기타": "#8A8078",
};

// ★ 재방문 포함 총 방문 횟수
function getTotalVisits(r: VisitedRecord): number {
  return 1 + (r.visits?.length ?? 0);
}

export function CuisineChart({ visited }: { visited: VisitedRecord[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 150); return () => clearTimeout(t); }, []);

  // ★ 음식 종류별 집계: 총 방문 횟수 + 장소 수
  const grouped = visited.reduce((acc, r) => {
    const key = r.cuisine;
    if (!acc[key]) acc[key] = { visits: 0, places: 0 };
    acc[key].visits += getTotalVisits(r);
    acc[key].places += 1;
    return acc;
  }, {} as Record<string, { visits: number; places: number }>);

  // 총 방문 횟수 기준 정렬
  const top    = Object.entries(grouped).sort((a, b) => b[1].visits - a[1].visits).slice(0, 5);
  const maxVal = top[0]?.[1].visits ?? 1;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>🍴</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1412" }}>가장 많이 먹은 음식</span>
      </div>
      {top.length > 0 ? (
        <>
          <p style={{ fontSize: 13, color: "#8A8078", marginBottom: 14 }}>
            우리가 가장 좋아하는 건 <span style={{ fontWeight: 700, color: CUISINE_COLORS[top[0][0]] ?? "#C96B52" }}>{top[0][0]}</span>!
          </p>
          {top.map(([cuisine, data], ci) => {
            const col        = CUISINE_COLORS[cuisine] ?? "#8A8078";
            const w          = ready ? (data.visits / maxVal) * 100 : 0;
            const hasRevisit = data.visits > data.places;

            return (
              <div key={cuisine} style={{ marginBottom: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col }} />
                    <span style={{ fontSize: 13, color: "#1A1412", fontWeight: 500 }}>{cuisine}</span>
                    {/* ★ 재방문 뱃지 */}
                    {hasRevisit && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#C96B52", background: "#F2D5CC", borderRadius: 10, padding: "1px 5px" }}>🔁</span>
                    )}
                  </div>
                  {/* ★ 총 방문 횟수 + 장소 수 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1412" }}>{data.visits}회</span>
                    {hasRevisit && (
                      <span style={{ fontSize: 10, color: "#8A8078" }}>({data.places}곳)</span>
                    )}
                  </div>
                </div>
                <div style={{ height: 8, background: "#F0EBE3", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${w}%`, background: col, borderRadius: 5, transition: `width ${0.5 + ci * 0.1}s ease` }} />
                </div>
              </div>
            );
          })}
        </>
      ) : <p style={{ fontSize: 13, color: "#C0B8B0", padding: "20px 0", textAlign: "center" }}>기록이 없어요</p>}
    </div>
  );
}
