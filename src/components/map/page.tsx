import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/AppShell";
/* SSR 비활성화 — Leaflet은 브라우저 전용 */
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[460px] bg-cream animate-pulse mx-4 rounded-2xl"
    />
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
