// src/components/map/MapView.tsx
// Leaflet은 브라우저 전용 → dynamic import로 SSR 비활성화
"use client";

import { useEffect, useRef, useState } from "react";
import { SAMPLE_VISITED, SAMPLE_WISHLIST } from "@/lib/sample-data";

const ROSE  = "#C96B52";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";

type Filter = "all" | "visited" | "wish";

export default function MapView() {
  const mapRef     = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const mapId      = useRef("map-" + Math.random().toString(36).slice(2));
  const [filter, setFilter] = useState<Filter>("all");

  const visitedPins = SAMPLE_VISITED.filter(r => r.lat && r.lng);
  const wishPins    = SAMPLE_WISHLIST.filter(r => r.lat && r.lng);

  const updateMarkers = (L: any, map: any, f: Filter) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const all = [
      ...(f !== "wish"    ? visitedPins.map(r => ({ ...r, kind: "visited" as const })) : []),
      ...(f !== "visited" ? wishPins.map(r    => ({ ...r, kind: "wish"    as const })) : []),
    ];

    all.forEach(r => {
      const color = r.kind === "visited" ? ROSE : "#9B59B6";
      const icon  = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:rotate(-45deg);"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 14], className: "",
      });
      const area   = r.district ? `${r.sido} ${r.district}` : r.sido;
      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);
      marker.bindPopup(`<b>${r.name}</b><br/>${area}`);
      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    // Leaflet CSS 동적 로드
    if (!document.querySelector("#leaflet-css")) {
      const link   = document.createElement("link");
      link.id      = "leaflet-css";
      link.rel     = "stylesheet";
      link.href    = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then(L => {
      if (mapRef.current) return;
      const el = document.getElementById(mapId.current);
      if (!el) return;

      const map = (L as any).map(el, { center: [36.5, 127.5], zoom: 7 });
      (L as any).tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      mapRef.current = map;
      updateMarkers(L as any, map, "all");
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then(L => updateMarkers(L as any, mapRef.current, filter));
  }, [filter]);

  const filterBtns: { id: Filter; label: string }[] = [
    { id: "all",     label: `전체 (${visitedPins.length + wishPins.length})` },
    { id: "visited", label: `방문 (${visitedPins.length})` },
    { id: "wish",    label: `위시 (${wishPins.length})` },
  ];

  return (
    <div>
      <div style={{ padding: "20px 20px 14px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1A1412", marginBottom: 4 }}>우리가 함께 다녀온 곳들 🗺️</h2>
        <p style={{ fontSize: 13, color: MUTED }}>{visitedPins.length + wishPins.length}개의 맛집 추억이 담겨있어요</p>
      </div>

      {/* 필터 칩 */}
      <div style={{ display: "flex", gap: 8, paddingLeft: 20, marginBottom: 14, overflowX: "auto" }}>
        {filterBtns.map(({ id, label }) => (
          <button key={id} onClick={() => setFilter(id)} style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid ${filter === id ? ROSE : BORDER}`, background: filter === id ? ROSE : "#fff", color: filter === id ? "#fff" : MUTED, fontSize: 13, fontWeight: filter === id ? 600 : 400, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
            {label}
          </button>
        ))}
      </div>

      {/* 지도 */}
      <div style={{ margin: "0 16px", borderRadius: 16, overflow: "hidden", border: `1px solid ${BORDER}` }}>
        <div id={mapId.current} style={{ width: "100%", height: 460 }} />
      </div>

      {/* 범례 */}
      <div style={{ display: "flex", gap: 20, padding: "12px 20px", fontSize: 12, color: MUTED }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: ROSE, marginRight: 5, verticalAlign: "middle" }} />방문한 곳</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#9B59B6", marginRight: 5, verticalAlign: "middle" }} />위시리스트</span>
      </div>
    </div>
  );
}
