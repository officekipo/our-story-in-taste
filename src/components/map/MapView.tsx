// src/components/map/MapView.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SAMPLE_VISITED, SAMPLE_WISHLIST }           from "@/lib/sample-data";
import type { VisitedRecord, WishRecord }            from "@/types";

/* 선택한 핀 정보 */
interface PinInfo {
  name:     string;
  area:     string;
  cuisine:  string;
  kind:     "visited" | "wish";
  recordId: string;   // visited id (wish는 "")
  lat:      number;
  lng:      number;
}

const ROSE  = "#C96B52";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";
const INK   = "#1A1412";
const WARM  = "#FAF7F3";
const SAGE  = "#6B9E7E";

type Filter = "all" | "visited" | "wish";

/* ── 핀 정보 팝업 (중앙 카드 스타일) ── */
function PinPopup({ info, onClose }: { info: PinInfo; onClose: () => void }) {
  const naverQuery = encodeURIComponent(info.name + " " + info.area);
  const naverUrl   = `https://map.naver.com/v5/search/${naverQuery}`;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 340, background: "#fff", borderRadius: 20, padding: "20px 20px 18px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", animation: "scaleIn 0.18s ease both" }}
      >
        {/* 종류 배지 */}
        <div style={{ marginBottom: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
            background: info.kind === "visited" ? "#F2D5CC" : "#C8DED1",
            color:      info.kind === "visited" ? ROSE       : SAGE,
          }}>
            {info.kind === "visited" ? "📍 방문한 곳" : "⭐ 위시리스트"}
          </span>
        </div>

        {/* 식당명 */}
        <p style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 4 }}>{info.name}</p>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>📍 {info.area} · {info.cuisine}</p>

        {/* 버튼 2개 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* 글로 이동 — visited만 */}
          {info.kind === "visited" && (
            <button
              onClick={() => {
                /* Step07 이후 실제 상세 모달 열기로 교체 가능 */
                alert(`"${info.name}" 기록 상세 보기\n(Firestore 연동 후 활성화)`);
              }}
              style={{ width: "100%", padding: "11px", background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              📖 기록 보러가기
            </button>
          )}

          {/* 네이버 지도로 이동 */}
          <a
            href={naverUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ width: "100%", padding: "11px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: "#03C75A", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "center", textDecoration: "none", display: "block", boxSizing: "border-box" }}
          >
            🗺️ 네이버 지도로 보기
          </a>

          <button
            onClick={onClose}
            style={{ width: "100%", padding: "10px", background: "none", border: "none", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          >닫기</button>
        </div>
      </div>
    </div>
  );
}

/* ── 메인 지도 컴포넌트 ── */
export default function MapView() {
  const mapRef     = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const mapId      = useRef("map-" + Math.random().toString(36).slice(2));
  const [filter,   setFilter]   = useState<Filter>("all");
  const [pinInfo,  setPinInfo]  = useState<PinInfo | null>(null);

  const visitedPins = SAMPLE_VISITED.filter((r) => r.lat && r.lng);
  const wishPins    = SAMPLE_WISHLIST.filter((r) => r.lat && r.lng);

  const updateMarkers = useCallback((L: any, map: any, f: Filter) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const all: (VisitedRecord & { kind: "visited" } | WishRecord & { kind: "wish" })[] = [
      ...(f !== "wish"    ? visitedPins.map((r) => ({ ...r, kind: "visited" as const })) : []),
      ...(f !== "visited" ? wishPins.map((r)    => ({ ...r, kind: "wish"    as const })) : []),
    ];

    all.forEach((r) => {
      const color = r.kind === "visited" ? ROSE : "#9B59B6";
      const icon  = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:rotate(-45deg);"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 14], className: "",
      });

      const area   = (r as any).district ? `${r.sido} ${(r as any).district}` : r.sido;
      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);

      /* 클릭 시 커스텀 팝업 (Leaflet 기본 팝업 대신) */
      marker.on("click", () => {
        setPinInfo({
          name:     r.name,
          area,
          cuisine:  r.cuisine,
          kind:     r.kind,
          recordId: r.kind === "visited" ? (r as VisitedRecord).id : "",
          lat:      r.lat!,
          lng:      r.lng!,
        });
      });

      markersRef.current.push(marker);
    });
  }, []);

  useEffect(() => {
    if (!document.querySelector("#leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    import("leaflet").then((L) => {
      if (mapRef.current) return;
      const el = document.getElementById(mapId.current);
      if (!el) return;
      const map = (L as any).map(el, { center: [36.5, 127.5], zoom: 7 });
      (L as any).tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
      mapRef.current = map;
      updateMarkers(L as any, map, "all");
    });
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => updateMarkers(L as any, mapRef.current, filter));
  }, [filter, updateMarkers]);

  const filterBtns: { id: Filter; label: string }[] = [
    { id: "all",     label: `전체 (${visitedPins.length + wishPins.length})` },
    { id: "visited", label: `방문 (${visitedPins.length})` },
    { id: "wish",    label: `위시 (${wishPins.length})` },
  ];

  return (
    <div>
      <div style={{ padding: "20px 20px 14px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 4 }}>우리가 함께 다녀온 곳들 🗺️</h2>
        <p style={{ fontSize: 13, color: MUTED }}>{visitedPins.length + wishPins.length}개의 맛집 추억이 담겨있어요</p>
      </div>

      <div style={{ display: "flex", gap: 8, paddingLeft: 20, marginBottom: 14, overflowX: "auto" }}>
        {filterBtns.map(({ id, label }) => (
          <button key={id} onClick={() => setFilter(id)} style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid ${filter === id ? ROSE : BORDER}`, background: filter === id ? ROSE : "#fff", color: filter === id ? "#fff" : MUTED, fontSize: 13, fontWeight: filter === id ? 600 : 400, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ margin: "0 16px", borderRadius: 16, overflow: "hidden", border: `1px solid ${BORDER}` }}>
        <div id={mapId.current} style={{ width: "100%", height: 460 }} />
      </div>

      <div style={{ display: "flex", gap: 20, padding: "12px 20px", fontSize: 12, color: MUTED }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: ROSE, marginRight: 5, verticalAlign: "middle" }} />방문한 곳</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#9B59B6", marginRight: 5, verticalAlign: "middle" }} />위시리스트</span>
        <span style={{ marginLeft: "auto", fontSize: 11 }}>핀을 탭하면 상세 정보를 볼 수 있어요</span>
      </div>

      {/* 핀 선택 팝업 */}
      {pinInfo && <PinPopup info={pinInfo} onClose={() => setPinInfo(null)} />}
    </div>
  );
}
