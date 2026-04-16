// ============================================================
//  map/page.tsx  적용 경로: src/app/map/page.tsx
// ============================================================
"use client";

import { useState }    from "react";
import dynamic         from "next/dynamic";
import { AppShell }    from "@/components/layout/AppShell";
import { useVisited }  from "@/hooks/useVisited";
import { useWishlist } from "@/hooks/useWishlist";

const ROSE   = "#C96B52";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";
const BG     = "#F5F0EB";

export type MapFilter = "all" | "visited" | "wish";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 14 }}>
      지도 불러오는 중…
    </div>
  ),
});

export default function MapPage() {
  const [filter, setFilter] = useState<MapFilter>("all");
  const { records: visited }  = useVisited();
  const { records: wishlist } = useWishlist();

  const totalCount   = visited.length + wishlist.length;
  const visitedCount = visited.length;
  const wishCount    = wishlist.length;

  const tabs: { key: MapFilter; label: string; count: number }[] = [
    { key: "all",     label: "전체", count: totalCount   },
    { key: "visited", label: "방문", count: visitedCount },
    { key: "wish",    label: "위시", count: wishCount    },
  ];

  return (
    <AppShell activeTab="map" noPad>
      {/*
        AppShell noPad → main 이 display:flex + flexDirection:column
        ∴ 직접 자식도 flex:1 + minHeight:0 으로 받아야 남은 높이 전부 차지
        height:100% 은 flex 컨텍스트에서 동작 안 함
      */}
      <div style={{
        flex:          1,
        maxHeight:     "calc(100% - 64px)",
        minHeight:     0,
        display:       "flex",
        flexDirection: "column",
        background:    BG,
      }}>

        {/* ── 커스텀 헤더 영역 (고정 높이) ── */}
        <div style={{ flexShrink: 0, padding: "18px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: INK }}>우리가 함께 다녀온 곳들</span>
            <span style={{ fontSize: 18 }}>🗺️</span>
          </div>
          <p style={{ fontSize: 12, color: MUTED, margin: "0 0 14px" }}>
            {totalCount}개의 맛집 추억이 담겨있어요
          </p>

          {/* 필터 탭 */}
          <div style={{ display: "flex", gap: 8, paddingBottom: 14 }}>
            {tabs.map(tab => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    padding:      "6px 14px",
                    borderRadius: 20,
                    border:       active ? "none" : `1px solid ${BORDER}`,
                    background:   active ? ROSE : WARM,
                    color:        active ? "#fff" : INK,
                    fontSize:     13,
                    fontWeight:   active ? 700 : 400,
                    fontFamily:   "inherit",
                    cursor:       "pointer",
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 지도 (flex:1 → 남은 높이 전부 차지) ── */}
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          <MapView filter={filter} />
        </div>

      </div>
    </AppShell>
  );
}
