// src/components/layout/BottomNav.tsx
"use client";

import { useRouter } from "next/navigation";
import { HomeIcon, StarTabIcon, MapPinIcon, ChartIcon, ChatIcon } from "@/components/common/Icons";

export type TabId = "visited" | "wishlist" | "map" | "stats" | "community";

const TABS: { id: TabId; label: string; path: string; Icon: React.ComponentType<{ color: string }> }[] = [
  { id: "visited",   label: "다녀온 곳", path: "/",          Icon: HomeIcon    },
  { id: "wishlist",  label: "가고싶어",  path: "/wishlist",  Icon: StarTabIcon },
  { id: "map",       label: "지도",      path: "/map",       Icon: MapPinIcon  },
  { id: "stats",     label: "통계",      path: "/stats",     Icon: ChartIcon   },
  { id: "community", label: "추천",      path: "/community", Icon: ChatIcon    },
];

const ROSE  = "#C96B52";
const MUTED = "#8A8078";

export function BottomNav({ activeTab }: { activeTab: TabId }) {
  const router = useRouter();
  return (
    <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #E2DDD8", display: "flex", zIndex: 50 }}>
      {TABS.map(({ id, label, path, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => router.push(path)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 2px", border: "none", borderTop: `2px solid ${active ? ROSE : "transparent"}`, background: "none", cursor: "pointer", transition: "all 0.2s" }}
          >
            <Icon color={active ? ROSE : MUTED} />
            <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? ROSE : MUTED }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
