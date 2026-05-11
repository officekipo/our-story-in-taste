// ============================================================
//  MapView.tsx  적용 경로: src/components/map/MapView.tsx
//
//  Fix:
//    1. 마커 사이즈 축소 (32→24px, font-size 15→11px)
//    2. 하단 팝업에 카카오맵 / 네이버지도 "자세히 보기" 링크 추가
//    3. ★ [클러스터링] 순수 Leaflet으로 직접 구현 — 외부 플러그인 없음
//       Turbopack 모듈 격리 문제 완전 우회
//       줌/이동 시 자동 재클러스터링
//       클러스터 클릭 → 해당 영역 줌인
// ============================================================
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useVisited }  from "@/hooks/useVisited";
import { useWishlist } from "@/hooks/useWishlist";
import type { VisitedRecord, WishRecord } from "@/types";
import type { MapFilter } from "@/app/map/page";

const ROSE   = "#C96B52";
const SAGE   = "#6B9E7E";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";
const BG     = "#F5F0EB";

const CLUSTER_RADIUS = 60; // px 단위 클러스터링 반경

type PinTarget =
  | { type: "visited"; data: VisitedRecord }
  | { type: "wish";    data: WishRecord };

// ── 순수 JS 클러스터 알고리즘 ──────────────────────────────────
// 픽셀 좌표 기준 CLUSTER_RADIUS 이내 핀을 그룹으로 묶음
function buildClusters(
  pins: PinTarget[],
  map: any,
  radius: number,
): Array<{ pins: PinTarget[]; lat: number; lng: number }> {
  const assigned = new Set<number>();
  const result:   Array<{ pins: PinTarget[]; lat: number; lng: number }> = [];

  for (let i = 0; i < pins.length; i++) {
    if (assigned.has(i)) continue;

    const ptA   = map.latLngToContainerPoint([pins[i].data.lat!, pins[i].data.lng!]);
    const group: PinTarget[] = [pins[i]];
    assigned.add(i);

    for (let j = i + 1; j < pins.length; j++) {
      if (assigned.has(j)) continue;
      const ptB = map.latLngToContainerPoint([pins[j].data.lat!, pins[j].data.lng!]);
      const dx  = ptA.x - ptB.x;
      const dy  = ptA.y - ptB.y;
      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        group.push(pins[j]);
        assigned.add(j);
      }
    }

    const lat = group.reduce((s, p) => s + p.data.lat!, 0) / group.length;
    const lng = group.reduce((s, p) => s + p.data.lng!, 0) / group.length;
    result.push({ pins: group, lat, lng });
  }

  return result;
}

interface Props {
  filter?: MapFilter;
}

export default function MapView({ filter = "all" }: Props) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapInst    = useRef<any>(null);
  const leafletRef = useRef<any>(null);          // ★ L 인스턴스 저장
  const markersRef = useRef<any[]>([]);

  const { records: visited,  loading: vLoad } = useVisited();
  const { records: wishlist, loading: wLoad } = useWishlist();
  const loading = vLoad || wLoad;

  const [selected, setSelected] = useState<PinTarget | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // ── Leaflet 초기화 ──────────────────────────────────────────
  useEffect(() => {
    let destroyed = false;

    if (!document.getElementById("leaflet-css")) {
      const link  = document.createElement("link");
      link.id     = "leaflet-css";
      link.rel    = "stylesheet";
      link.href   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (destroyed || !mapRef.current) return;

      leafletRef.current = L;                    // ★ 저장

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

  // ── 마커 렌더링 (클러스터링 포함) ──────────────────────────
  const renderMarkers = useCallback((pins: PinTarget[]) => {
    const L   = leafletRef.current;
    const map = mapInst.current;
    if (!L || !map) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => { try { m.remove(); } catch {} });
    markersRef.current = [];

    if (pins.length === 0) return;

    const clusters = buildClusters(pins, map, CLUSTER_RADIUS);

    clusters.forEach((cluster) => {
      if (cluster.pins.length > 1) {
        // ── 클러스터 마커 ──────────────────────────────
        const count   = cluster.pins.length;
        const size    = count < 10 ? 36 : count < 30 ? 44 : 52;
        const allWish = cluster.pins.every(p => p.type === "wish");
        const bg      = allWish ? SAGE : ROSE;

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:${size}px;height:${size}px;
            background:${bg};border-radius:50%;
            border:3px solid rgba(255,255,255,0.9);
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-size:${size < 44 ? 13 : 15}px;font-weight:700;
          ">${count}</div>`,
          iconSize:   [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const m = L.marker([cluster.lat, cluster.lng], { icon })
          .addTo(map)
          .on("click", () => {
            const bounds = L.latLngBounds(
              cluster.pins.map(p => [p.data.lat!, p.data.lng!] as [number, number])
            );
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
          });
        markersRef.current.push(m);

      } else {
        // ── 개별 핀 마커 ──────────────────────────────
        const pin   = cluster.pins[0];
        const color = pin.type === "visited" ? ROSE : SAGE;
        const emoji = pin.data.emoji || (pin.type === "visited" ? "🍽️" : "⭐");

        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color};color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 2px 5px rgba(0,0,0,0.22)"><span style="transform:rotate(45deg)">${emoji}</span></div>`,
          iconSize: [24, 24], iconAnchor: [12, 24],
        });

        const m = L.marker([pin.data.lat!, pin.data.lng!], { icon })
          .addTo(map)
          .on("click", () => setSelected(pin));
        markersRef.current.push(m);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 데이터/필터 변경 시 마커 갱신 + 줌/이동 이벤트 등록 ──────
  useEffect(() => {
    if (!mapReady || !mapInst.current || !leafletRef.current) return;

    const L   = leafletRef.current;
    const map = mapInst.current;

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

    // 초기 렌더
    renderMarkers(pins);

    // ★ 줌/이동 시 재클러스터링
    const onViewChange = () => renderMarkers(pins);
    map.on("zoomend", onViewChange);
    map.on("moveend", onViewChange);

    // 초기 fitBounds
    if (pins.length > 0) {
      const bounds = L.latLngBounds(pins.map(p => [p.data.lat!, p.data.lng!] as [number, number]));
      map.fitBounds(bounds, { padding: [48, 48] });
    }

    return () => {
      map.off("zoomend", onViewChange);
      map.off("moveend", onViewChange);
    };
  }, [mapReady, visited, wishlist, filter, renderMarkers]);

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
