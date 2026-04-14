// ============================================================
//  map/page.tsx  적용 경로: src/app/map/page.tsx
// ============================================================
"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/AppShell";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "#8A8078", fontSize: 14 }}>
      지도 불러오는 중…
    </div>
  ),
});

export default function MapPage() {
  return (
    // noPad → main { display:flex; flex-direction:column; paddingBottom:0 }
    // MapView { flex:1 } → BottomNav 위까지 정확히 채움
    <AppShell activeTab="map" noPad>
      <MapView />
    </AppShell>
  );
}
