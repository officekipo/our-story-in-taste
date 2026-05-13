// src/components/stats/RevisitBar.tsx
//
//  Fix / Add:
//    ★ 실제 재방문 횟수 표시: visits 배열 길이 합산
//    ★ "재방문 의향" 바 + "실제 다시 간 횟수" 인포 카드 분리
"use client";
import { useState, useEffect } from "react";
import type { VisitedRecord }  from "@/types";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const MUTED   = "#8A8078";

export function RevisitBar({ visited }: { visited: VisitedRecord[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 200); return () => clearTimeout(t); }, []);

  const total = visited.length;

  // 재방문 의향 (revisit === true 인 레코드)
  const rv    = visited.filter(r => r.revisit === true).length;
  const pct   = total > 0 ? Math.round((rv / total) * 100) : 0;

  // ★ 실제 재방문 횟수: visits 배열 길이 합산
  const actualRevisitCount = visited.reduce((s, r) => s + (r.visits?.length ?? 0), 0);
  // ★ 실제 재방문이 있는 장소 수
  const revisitedPlaces = visited.filter(r => (r.visits?.length ?? 0) > 0).length;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>💝</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1412" }}>재방문</span>
      </div>

      {/* ★ 실제 재방문 요약 카드 (재방문 기록이 있을 때만) */}
      {actualRevisitCount > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: ROSE_LT, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: ROSE }}>{actualRevisitCount}회</div>
            <div style={{ fontSize: 10, color: ROSE, marginTop: 2, fontWeight: 600 }}>실제 재방문</div>
          </div>
          <div style={{ flex: 1, background: "#F0EBE3", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#8C4A38" }}>{revisitedPlaces}곳</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 2, fontWeight: 600 }}>재방문한 장소</div>
          </div>
        </div>
      )}

      {/* 재방문 의향 바 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: MUTED }}>또 가고 싶은 곳</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: ROSE }}>{rv}곳</span>
      </div>
      <div style={{ height: 16, background: "#F0EBE3", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ height: "100%", width: ready ? `${pct}%` : "0%", background: "linear-gradient(90deg,#C96B52,#E8897A)", borderRadius: 8, transition: "width 1.1s cubic-bezier(.34,1,.64,1)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}>
          {pct >= 20 && <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{pct}%</span>}
        </div>
      </div>
      <p style={{ fontSize: 12, color: MUTED, textAlign: "center" }}>
        방문한 곳 중 <span style={{ fontWeight: 700, color: ROSE }}>{pct}%</span>가 또 가고 싶은 맛집!
      </p>
    </div>
  );
}
