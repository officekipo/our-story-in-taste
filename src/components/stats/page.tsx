"use client";
import { useMemo, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCards } from "@/components/stats/StatCards";
import { BarChart } from "@/components/stats/BarChart";
import { CuisineChart } from "@/components/stats/CuisineChart";
import { RegionPieChart } from "@/components/stats/RegionPieChart";
import { RevisitBar } from "@/components/stats/RevisitBar";
import { RestaurantRanking } from "@/components/stats/RestaurantRanking";
import { SAMPLE_VISITED } from "@/lib/sample-data";
export default function StatsPage() {
  const visited = SAMPLE_VISITED;
  const total = visited.length;
  const rv = visited.filter((r) => r.revisit === true).length;
  const revisitPct = total > 0 ? Math.round((rv / total) * 100) : 0;
  /* 월별 카운트 */
  const byMonth = useMemo(
    () =>
      visited.reduce(
        (acc, r) => {
          const m = r.date.slice(0, 7);
          acc[m] = (acc[m] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [visited],
  );
  const months = Object.keys(byMonth).sort().slice(-6);
  const monthAvg =
    total > 0
      ? (total / Math.max(Object.keys(byMonth).length, 1)).toFixed(1)
      : "0";
  return (
    <AppShell
      activeTab="stats"
      headerProps={{ visitedCount: total, avgRating: "4.5", wishCount: 3 }}
    >
      <div className="px-4 pt-4 animate-fade-in">
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
