// src/components/stats/RestaurantRanking.tsx
import type { VisitedRecord } from "@/types";

const RANK_EMOJI = ["🥇", "🥈", "🥉", "4위", "5위"];
const RANK_BG    = ["#FDE8E5", "#FBF0E8", "#F5F0EB", "#F5F0EB", "#F5F0EB"];
const RANK_COLOR = ["#C96B52", "#D4956A", "#8A8078", "#8A8078", "#8A8078"];

export function RestaurantRanking({ visited }: { visited: VisitedRecord[] }) {
  const counts = visited.reduce((acc, r) => { acc[r.name] = (acc[r.name] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const top    = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>🏅</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1412" }}>자주 간 식당</span>
      </div>
      {top.length > 0 ? top.map(([name, cnt], i) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < top.length - 1 ? "1px solid #E2DDD8" : "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: RANK_BG[i], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: RANK_COLOR[i] }}>{RANK_EMOJI[i]}</span>
          </div>
          <span style={{ flex: 1, fontSize: 14, color: "#1A1412", fontWeight: i < 2 ? 600 : 400 }}>{name}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#8A8078" }}>{cnt}회</span>
        </div>
      )) : <p style={{ textAlign: "center", padding: "20px 0", color: "#C0B8B0", fontSize: 13 }}>기록을 추가해보세요</p>}
    </div>
  );
}
