// src/app/stats/page.tsx
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
import { useWishlist }           from "@/hooks/useWishlist";  // ★ 추가

const DUMMY_MODE = false;
const ROSE = "#C96B52";

export default function StatsPage() {
  const firebase     = useVisited();
  const firebaseWish = useWishlist();  // ★ 추가

  const visited   = DUMMY_MODE ? SAMPLE_VISITED : firebase.records;
  const loading   = DUMMY_MODE ? false          : firebase.loading;
  const wishCount = DUMMY_MODE ? 0 : firebaseWish.records.length;  // ★ 실제 개수

  const total      = visited.length;
  const rv         = visited.filter(r => r.revisit === true).length;
  const revisitPct = total > 0 ? Math.round((rv / total) * 100) : 0;
  const avgRating  = total > 0
    ? (visited.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
    : "—";

  const byMonth = useMemo(() => visited.reduce((acc, r) => {
    const m = r.date.slice(0, 7);
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>), [visited]);

  const months   = Object.keys(byMonth).sort().slice(-6);
  const monthAvg = total > 0
    ? (total / Math.max(Object.keys(byMonth).length, 1)).toFixed(1)
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
    <AppShell activeTab="stats" headerProps={{ visitedCount: total, avgRating, wishCount }}>
      <div style={{ padding: "16px 16px 0" }}>
        <StatCards total={total} monthAvg={monthAvg} revisitPct={revisitPct} />
        <BarChart months={months} byMonth={byMonth} monthAvg={monthAvg} />
        <CuisineChart visited={visited} />
        <RegionPieChart visited={visited} />
        <RevisitBar visited={visited} />
        <RestaurantRanking visited={visited} />
      </div>
    </AppShell>
  );
}
