// src/app/stats/page.tsx
//
//  Fix / Add:
//    ★ totalVisits: 재방문 포함 총 방문 횟수 계산 (1 + visits.length)
//    ★ byMonth: 재방문 날짜도 월별 집계에 포함
//    ★ monthAvg: totalVisits 기준으로 변경
//    ★ StatCards에 places, totalVisits 분리 전달
"use client";

import { useMemo }               from "react";
import { AppShell }              from "@/components/layout/AppShell";
import { StatCards }             from "@/components/stats/StatCards";
import { BarChart }              from "@/components/stats/BarChart";
import { CuisineChart }          from "@/components/stats/CuisineChart";
import { RegionPieChart }        from "@/components/stats/RegionPieChart";
import { RevisitBar }            from "@/components/stats/RevisitBar";
import { RestaurantRanking }     from "@/components/stats/RestaurantRanking";
import { SAMPLE_VISITED }        from "@/lib/sample-data";
import { useVisited }            from "@/hooks/useVisited";
import { useWishlist }           from "@/hooks/useWishlist";

const DUMMY_MODE = false;
const ROSE = "#C96B52";

export default function StatsPage() {
  const firebase     = useVisited();
  const firebaseWish = useWishlist();

  const visited   = DUMMY_MODE ? SAMPLE_VISITED : firebase.records;
  const loading   = DUMMY_MODE ? false          : firebase.loading;
  const wishCount = DUMMY_MODE ? 0 : firebaseWish.records.length;

  // 장소(레코드) 수
  const places = visited.length;

  // ★ 재방문 포함 총 방문 횟수
  const totalVisits = useMemo(
    () => visited.reduce((s, r) => s + 1 + (r.visits?.length ?? 0), 0),
    [visited]
  );

  const rv         = visited.filter(r => r.revisit === true).length;
  const revisitPct = places > 0 ? Math.round((rv / places) * 100) : 0;
  const avgRating  = places > 0
    ? (visited.reduce((s, r) => s + r.rating, 0) / places).toFixed(1)
    : "—";

  // ★ 재방문 날짜도 월별 집계에 포함
  const byMonth = useMemo(() => visited.reduce((acc, r) => {
    const m = r.date.slice(0, 7);
    acc[m] = (acc[m] ?? 0) + 1;
    r.visits?.forEach(v => {
      const mv = v.date.slice(0, 7);
      acc[mv] = (acc[mv] ?? 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>), [visited]);

  const months = Object.keys(byMonth).sort().slice(-6);

  // ★ monthAvg: totalVisits 기준
  const monthAvg = totalVisits > 0
    ? (totalVisits / Math.max(Object.keys(byMonth).length, 1)).toFixed(1)
    : "0";

  if (loading) return (
    <AppShell activeTab="stats" headerProps={{ visitedCount: 0, avgRating: "—", wishCount: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 28, height: 28, border: "3px solid #F2D5CC", borderTopColor: ROSE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppShell>
  );

  return (
    <AppShell activeTab="stats" headerProps={{ visitedCount: places, avgRating, wishCount }}>
      <div style={{ padding: "16px 16px 0" }}>
        {/* ★ places + totalVisits 분리 전달 */}
        <StatCards places={places} totalVisits={totalVisits} monthAvg={monthAvg} revisitPct={revisitPct} />
        <BarChart months={months} byMonth={byMonth} monthAvg={monthAvg} hasRevisit={totalVisits > places} />
        <CuisineChart visited={visited} />
        <RegionPieChart visited={visited} />
        <RevisitBar visited={visited} />
        <RestaurantRanking visited={visited} />
      </div>
    </AppShell>
  );
}
