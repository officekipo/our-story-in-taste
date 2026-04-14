// ============================================================
//  MapView.tsx  적용 경로: src/components/map/MapView.tsx
//
//  Fix:
//    - flex:1 + minHeight:0 → 부모 높이 100% 채움
//    - 줌 버튼(우상단) 과 텍스트 겹침 해결 → 안내 텍스트 위치 조정
//    - 범례 위치 좌상단 → 줌 버튼 아래로 이동
// ============================================================
"use client";

import { useEffect, useRef, useState } from "react";
import { useVisited }  from "@/hooks/useVisited";
import { useWishlist } from "@/hooks/useWishlist";
import type { VisitedRecord, WishRecord } from "@/types";

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

export default function MapView() {
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

      const map = L.map(mapRef.current!, {
        center:      [37.5665, 126.978],
        zoom:        11,
        zoomControl: false,   // ★ 기본 줌 컨트롤 제거
      });

      // ★ 줌 컨트롤 우하단 배치 (텍스트 안 가림)
      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
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

  // ── 마커 갱신 ───────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapInst.current) return;

    import("leaflet").then((L) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const pins: PinTarget[] = [
        ...visited.filter(r  => r.lat != null && r.lng != null).map(r  => ({ type: "visited" as const, data: r  })),
        ...wishlist.filter(r => r.lat != null && r.lng != null).map(r => ({ type: "wish"    as const, data: r })),
      ];

      pins.forEach((pin) => {
        const color = pin.type === "visited" ? ROSE : SAGE;
        const emoji = pin.data.emoji || (pin.type === "visited" ? "🍽️" : "⭐");

        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color};color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 6px rgba(0,0,0,0.25)"><span style="transform:rotate(45deg)">${emoji}</span></div>`,
          iconSize: [32,32], iconAnchor: [16,32],
        });

        const m = L.marker([pin.data.lat!, pin.data.lng!], { icon })
          .addTo(mapInst.current)
          .on("click", () => setSelected(pin));
        markersRef.current.push(m);
      });

      if (pins.length > 0) {
        const bounds = L.latLngBounds(pins.map(p => [p.data.lat!, p.data.lng!] as [number,number]));
        mapInst.current.fitBounds(bounds, { padding: [48, 48] });
      }
    });
  }, [mapReady, visited, wishlist]);

  const noPinCount = [...visited, ...wishlist].filter(r => r.lat == null).length;

  return (
    // ★ flex:1 + minHeight:0 → AppShell main 의 남은 높이 전부 차지
    <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%", color: "#333" }} />

      {loading && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(245,240,235,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ color: MUTED, fontSize: 14 }}>지도 불러오는 중…</div>
        </div>
      )}

      {/* ★ 범례: 좌상단 (줌 버튼은 우하단이므로 겹치지 않음) */}
      {!loading && (
        <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.94)", borderRadius: 10, padding: "7px 11px", zIndex: 500, fontSize: 11, boxShadow: "0 1px 6px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: ROSE }} />
            <span>다녀온 곳 ({visited.filter(r => r.lat != null).length})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: SAGE }} />
            <span>가고싶은 곳 ({wishlist.filter(r => r.lat != null).length})</span>
          </div>
        </div>
      )}

      {/* ★ 위치 미등록 안내: 좌상단 범례 아래 */}
      {!loading && noPinCount > 0 && (
        <div style={{ position: "absolute", top: 68, left: 10, background: "rgba(26,20,18,0.70)", color: "#fff", borderRadius: 16, padding: "5px 12px", fontSize: 11, zIndex: 500 }}>
          📍 위치 미등록 {noPinCount}개
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && visited.length === 0 && wishlist.length === 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, pointerEvents: "none", zIndex: 400 }}>
          <div style={{ fontSize: 48 }}>🗺️</div>
          <div style={{ color: INK, fontWeight: 600 }}>아직 기록이 없어요</div>
          <div style={{ color: MUTED, fontSize: 13, textAlign: "center" }}>식당 검색으로 등록하면<br/>지도 핀이 자동으로 꽂혀요</div>
        </div>
      )}

      {/* 하단 상세 패널 */}
      {selected && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: WARM, borderTop: `1px solid ${BORDER}`, borderRadius: "18px 18px 0 0", padding: "18px 20px 28px", zIndex: 1000, boxShadow: "0 -4px 20px rgba(0,0,0,0.12)" }}>
          <button onClick={() => setSelected(null)}
            style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: MUTED }}>✕</button>

          <div style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, background: selected.type === "visited" ? "#F2D5CC" : "#C8DED1", color: selected.type === "visited" ? ROSE : SAGE, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
            {selected.type === "visited" ? "✅ 다녀온 곳" : "⭐ 가고싶은 곳"}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
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
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: 13, color: s <= (selected.data as VisitedRecord).rating ? ROSE : BORDER }}>★</span>
                  ))}
                </div>
              )}
              {selected.type === "wish" && (selected.data as WishRecord).note && (
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                  {(selected.data as WishRecord).note}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
