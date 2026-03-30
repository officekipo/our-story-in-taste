// src/app/map/page.tsx
import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/AppShell";

// Leaflet은 브라우저 전용 라이브러리이므로 SSR을 반드시 비활성화
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 460,
        background: "#F0EBE3",
        margin: "20px 16px",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#8A8078",
        fontSize: 14,
      }}
    >
      지도를 불러오는 중...
    </div>
  ),
});

export default function MapPage() {
  return (
    <AppShell
      activeTab="map"
      headerProps={{ visitedCount: 6, avgRating: "4.5", wishCount: 3 }}
    >
      <MapView />
    </AppShell>
  );
}
