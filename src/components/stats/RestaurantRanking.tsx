// src/components/stats/RestaurantRanking.tsx
//
//  Fix / Add:
//    ★ 재방문 포함 총 방문 횟수로 집계 (1 + visits.length)
//    ★ 2회 이상 방문 시 🔁 뱃지 + 방문 날짜 미니 히스토리 표시
//    ★ 별점 평균 표시 (재방문 별점 포함 평균)
"use client";
import { useState } from "react";
import type { VisitedRecord } from "@/types";

const RANK_EMOJI = ["🥇", "🥈", "🥉", "4위", "5위"];
const RANK_BG    = ["#FDE8E5", "#FBF0E8", "#F5F0EB", "#F5F0EB", "#F5F0EB"];
const RANK_COLOR = ["#C96B52", "#D4956A", "#8A8078", "#8A8078", "#8A8078"];
const ROSE       = "#C96B52";
const ROSE_LT    = "#F2D5CC";
const MUTED      = "#8A8078";

// ★ 레코드의 총 방문 횟수
function getTotalVisits(r: VisitedRecord): number {
  return 1 + (r.visits?.length ?? 0);
}

// ★ 재방문 포함 별점 평균
function getAvgRating(r: VisitedRecord): number {
  const all = [r.rating, ...(r.visits?.map(v => v.rating) ?? [])];
  return all.reduce((s, v) => s + v, 0) / all.length;
}

// ★ 방문 날짜 목록 (최신순)
function getVisitDates(r: VisitedRecord): string[] {
  const dates = [r.date, ...(r.visits?.map(v => v.date) ?? [])];
  return dates.sort((a, b) => b.localeCompare(a));
}

interface RankItem {
  record: VisitedRecord;
  totalVisits: number;
  avgRating: number;
  dates: string[];
}

export function RestaurantRanking({ visited }: { visited: VisitedRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ★ 이름 기준 집계 (같은 이름 레코드가 여러 개인 경우도 합산)
  const grouped = visited.reduce((acc, r) => {
    const key = r.name;
    if (!acc[key]) {
      acc[key] = { record: r, totalVisits: 0, allRatings: [], allDates: [] };
    }
    // 더 최신 레코드로 대표 record 교체
    if (r.createdAt > acc[key].record.createdAt) acc[key].record = r;
    acc[key].totalVisits  += getTotalVisits(r);
    acc[key].allRatings   = [...acc[key].allRatings, r.rating, ...(r.visits?.map(v => v.rating) ?? [])];
    acc[key].allDates     = [...acc[key].allDates, ...getVisitDates(r)];
    return acc;
  }, {} as Record<string, { record: VisitedRecord; totalVisits: number; allRatings: number[]; allDates: string[] }>);

  const top: RankItem[] = Object.values(grouped)
    .map(g => ({
      record:      g.record,
      totalVisits: g.totalVisits,
      avgRating:   g.allRatings.reduce((s, v) => s + v, 0) / g.allRatings.length,
      dates:       [...new Set(g.allDates)].sort((a, b) => b.localeCompare(a)),
    }))
    .sort((a, b) => b.totalVisits - a.totalVisits || b.avgRating - a.avgRating)
    .slice(0, 5);

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  if (top.length === 0) return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>🏅</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1412" }}>자주 간 식당</span>
      </div>
      <p style={{ textAlign: "center", padding: "20px 0", color: "#C0B8B0", fontSize: 13 }}>기록을 추가해보세요</p>
    </div>
  );

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>🏅</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1412" }}>자주 간 식당</span>
      </div>

      {top.map((item, i) => {
        const isExpanded   = expandedId === item.record.id;
        const hasRevisit   = item.totalVisits >= 2;
        const avgRatingStr = item.avgRating.toFixed(1);

        return (
          <div
            key={item.record.id}
            style={{ borderBottom: i < top.length - 1 ? "1px solid #E2DDD8" : "none" }}
          >
            {/* ── 메인 행 ── */}
            <div
              onClick={() => hasRevisit && toggleExpand(item.record.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", cursor: hasRevisit ? "pointer" : "default" }}
            >
              {/* 순위 뱃지 */}
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: RANK_BG[i], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: RANK_COLOR[i] }}>{RANK_EMOJI[i]}</span>
              </div>

              {/* 식당명 + 재방문 뱃지 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, color: "#1A1412", fontWeight: i < 2 ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                    {item.record.name}
                  </span>
                  {/* ★ 재방문 뱃지 */}
                  {hasRevisit && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: ROSE, background: ROSE_LT, borderRadius: 20, padding: "2px 7px", flexShrink: 0 }}>
                      🔁 {item.totalVisits}번
                    </span>
                  )}
                </div>
                {/* 별점 평균 */}
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: 10, color: s <= Math.round(item.avgRating) ? ROSE : "#E2DDD8" }}>★</span>
                  ))}
                  <span style={{ fontSize: 10, color: MUTED, marginLeft: 2 }}>{avgRatingStr}</span>
                </div>
              </div>

              {/* 방문 횟수 + 펼치기 화살표 */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: hasRevisit ? ROSE : MUTED }}>
                  {item.totalVisits}회
                </span>
                {hasRevisit && (
                  <span style={{ fontSize: 9, color: MUTED, transition: "transform 0.2s", display: "inline-block", transform: isExpanded ? "rotate(0deg)" : "rotate(180deg)" }}>▲</span>
                )}
              </div>
            </div>

            {/* ★ 방문 날짜 히스토리 (펼쳤을 때) */}
            {isExpanded && (
              <div style={{ background: "#FAF7F3", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: MUTED, marginBottom: 8, fontWeight: 600 }}>📅 방문 기록</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {item.dates.map((date, di) => (
                    <span
                      key={`${date}-${di}`}
                      style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: di === 0 ? ROSE_LT : "#F0EBE3", color: di === 0 ? ROSE : MUTED, fontWeight: di === 0 ? 700 : 400 }}
                    >
                      {date}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
