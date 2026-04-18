// ============================================================
//  MapView.tsx  적용 경로: src/components/map/MapView.tsx
//
//  Fix:
//    1. 마커 사이즈 축소 (32→24px, font-size 15→11px)
//    2. 하단 팝업에 카카오맵 / 네이버지도 "자세히 보기" 링크 추가
// ============================================================
"use client";

import { useEffect, useRef, useState } from "react";
import { useVisited }  from "@/hooks/useVisited";
import { useWishlist } from "@/hooks/useWishlist";
import type { VisitedRecord, WishRecord } from "@/types";
import type { MapFilter } from "@/app/map/page";

const ROSE  = "#C96B52";
const SAGE  = "#6B9E7E";
const INK   = "#1A1412";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";
const WARM  = "#FAF7F3";
const BG    = "#F5F0EB";

type PinTarget =
  | { type: "visited"; data: VisitedRecord }
  | { type: "wish";    data: WishRecord };

interface Props {
  filter?: MapFilter;
}

export default function MapView({ filter = "all" }: Props) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapInst    = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const { records: visited,  loading: vLoad } = useVisited();
  const { records: wishlist, loading: wLoad } = useWishlist();
  const loading = vLoad || wLoad;

  const [selected, setSelected] = useState<PinTarget | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // ── Leaflet 초기화 ──────────────────────────────────────
  useEffect(() => {
    let destroyed = false;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (destroyed || !mapRef.current) return;

      if (mapInst.current) {
        mapInst.current.remove();
        mapInst.current = null;
        setMapReady(false);
      }
      const container = mapRef.current as any;
      if (container._leaflet_id) delete container._leaflet_id;

      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, { center: [37.5665, 126.978], zoom: 11, zoomControl: false });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors", maxZoom: 19,
      }).addTo(map);

      mapInst.current = map;
      setMapReady(true);
    });

    return () => {
      destroyed = true;
      mapInst.current?.remove();
      mapInst.current = null;
      setMapReady(false);
    };
  }, []);

  // ── 마커 갱신 ──────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapInst.current) return;

    import("leaflet").then((L) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const visitedPins: PinTarget[] = visited
        .filter(r => r.lat != null && r.lng != null)
        .map(r => ({ type: "visited" as const, data: r }));

      const wishPins: PinTarget[] = wishlist
        .filter(r => r.lat != null && r.lng != null)
        .map(r => ({ type: "wish" as const, data: r }));

      const pins: PinTarget[] =
        filter === "visited" ? visitedPins :
        filter === "wish"    ? wishPins    :
        [...visitedPins, ...wishPins];

      pins.forEach((pin) => {
        const color = pin.type === "visited" ? ROSE : SAGE;
        const emoji = pin.data.emoji || (pin.type === "visited" ? "🍽️" : "⭐");

        // ★ 마커 사이즈 축소: 32→24px, font 15→11px
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color};color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 2px 5px rgba(0,0,0,0.22)"><span style="transform:rotate(45deg)">${emoji}</span></div>`,
          iconSize: [24, 24], iconAnchor: [12, 24],
        });

        const m = L.marker([pin.data.lat!, pin.data.lng!], { icon })
          .addTo(mapInst.current)
          .on("click", () => setSelected(pin));
        markersRef.current.push(m);
      });

      if (pins.length > 0) {
        const bounds = L.latLngBounds(pins.map(p => [p.data.lat!, p.data.lng!] as [number, number]));
        mapInst.current.fitBounds(bounds, { padding: [48, 48] });
      }
    });
  }, [mapReady, visited, wishlist, filter]);

  // ★ 카카오맵 / 네이버지도 링크 생성
  const getMapLinks = (pin: PinTarget) => {
    const name = encodeURIComponent(pin.data.name);
    const lat  = pin.data.lat!;
    const lng  = pin.data.lng!;
    return {
      kakao:  `https://map.kakao.com/link/search/${name}`,
      naver:  `https://map.naver.com/v5/search/${name}?c=${lng},${lat},15,0,0,0,dh`,
    };
  };

  const noPinCount =
    filter === "visited" ? visited.filter(r => r.lat == null).length :
    filter === "wish"    ? wishlist.filter(r => r.lat == null).length :
    [...visited, ...wishlist].filter(r => r.lat == null).length;

  const isEmpty =
    filter === "visited" ? visited.length === 0 :
    filter === "wish"    ? wishlist.length === 0 :
    visited.length === 0 && wishlist.length === 0;

  const legendRows = filter === "all" ? 2 : 1;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>

      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {loading && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(245,240,235,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ color: MUTED, fontSize: 14 }}>지도 불러오는 중…</div>
        </div>
      )}

      {/* 범례 */}
      {!loading && (
        <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.94)", borderRadius: 10, padding: "7px 11px", zIndex: 500, fontSize: 11, boxShadow: "0 1px 6px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", gap: 4 }}>
          {(filter === "all" || filter === "visited") && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: ROSE }} />
              <span style={{ color: INK }}>방문한 곳 ({visited.filter(r => r.lat != null).length})</span>
            </div>
          )}
          {(filter === "all" || filter === "wish") && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: SAGE }} />
              <span style={{ color: INK }}>위시리스트 ({wishlist.filter(r => r.lat != null).length})</span>
            </div>
          )}
        </div>
      )}

      {!loading && noPinCount > 0 && (
        <div style={{ position: "absolute", top: 10 + (legendRows * 26) + 14, left: 10, background: "rgba(26,20,18,0.70)", color: "#fff", borderRadius: 16, padding: "5px 12px", fontSize: 11, zIndex: 500 }}>
          📍 위치 미등록 {noPinCount}개
        </div>
      )}

      {!loading && !isEmpty && (
        <div style={{ position: "absolute", bottom: selected ? 220 : 48, left: "50%", transform: "translateX(-50%)", background: "rgba(26,20,18,0.60)", color: "#fff", borderRadius: 16, padding: "5px 14px", fontSize: 11, zIndex: 500, whiteSpace: "nowrap", transition: "bottom 0.25s", pointerEvents: "none" }}>
          핀을 탭하면 상세 정보를 볼 수 있어요
        </div>
      )}

      {!loading && isEmpty && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(0,0,0,0.45)", pointerEvents: "none", zIndex: 400, color: WARM }}>
          <div style={{ fontSize: 48 }}>🗺️</div>
          <div style={{ fontWeight: 600 }}>아직 기록이 없어요</div>
          <div style={{ fontSize: 13, textAlign: "center" }}>식당 검색으로 등록하면<br />지도 핀이 자동으로 꽂혀요</div>
        </div>
      )}

      {/* 하단 상세 패널 */}
      {selected && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: WARM, borderTop: `1px solid ${BORDER}`, borderRadius: "18px 18px 0 0", padding: "18px 20px 28px", zIndex: 1000, boxShadow: "0 -4px 20px rgba(0,0,0,0.12)" }}>
          <button
            onClick={() => setSelected(null)}
            style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: MUTED }}
          >✕</button>

          <div style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, background: selected.type === "visited" ? "#F2D5CC" : "#C8DED1", color: selected.type === "visited" ? ROSE : SAGE, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
            {selected.type === "visited" ? "✅ 다녀온 곳" : "⭐ 가고싶은 곳"}
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: BG, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
              {selected.data.imgUrls?.[0]
                ? <img src={selected.data.imgUrls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (selected.data.emoji || "🍽️")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: INK, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selected.data.name}
              </div>
              <div style={{ fontSize: 12, color: MUTED }}>
                {selected.data.sido} {selected.data.district} · {selected.data.cuisine}
              </div>
              {selected.type === "visited" && (
                <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} style={{ fontSize: 13, color: s <= (selected.data as VisitedRecord).rating ? ROSE : BORDER }}>★</span>
                  ))}
                </div>
              )}
              {selected.type === "wish" && (selected.data as WishRecord).note && (
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {(selected.data as WishRecord).note}
                </div>
              )}
            </div>
          </div>

          {/* ★ 카카오맵 / 네이버지도 링크 */}
          {selected.data.lat != null && (
            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={getMapLinks(selected).kakao}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", background: "#FEE500", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#3C1E1E", textDecoration: "none" }}
              >
                <span style={{ fontSize: 14 }}>🗺️</span> 카카오맵
              </a>
              <a
                href={getMapLinks(selected).naver}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", background: "#03C75A", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff", textDecoration: "none" }}
              >
                <span style={{ fontSize: 14 }}>📍</span> 네이버지도
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
