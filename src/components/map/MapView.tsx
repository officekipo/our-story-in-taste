"use client";
import { useEffect, useRef, useState } from "react";
import { SAMPLE_VISITED, SAMPLE_WISHLIST } from "@/lib/sample-data";
import { cn } from "@/lib/utils/cn";
type Filter = "all" | "visited" | "wish";
export default function MapView() {
  const mapRef = useRef<any>(null); // Leaflet Map 인스턴스
  const markersRef = useRef<any[]>([]); // 마커 배열 (필터 변경 시 교체)
  const mapId = useRef("map-" + Math.random().toString(36).slice(2));
  const [filter, setFilter] = useState<Filter>("all");
  const visitedWithPin = SAMPLE_VISITED.filter((r) => r.lat && r.lng);
  const wishWithPin = SAMPLE_WISHLIST.filter((r) => r.lat && r.lng);
  /* ── 마커 업데이트 함수 ── */
  const updateMarkers = (L: any, map: any, f: Filter) => {
    // 기존 마커 제거
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const all = [
      ...(f !== "wish"
        ? visitedWithPin.map((r) => ({ ...r, kind: "visited" }))
        : []),
      ...(f !== "visited"
        ? wishWithPin.map((r) => ({ ...r, kind: "wish" }))
        : []),
    ];
    all.forEach((r) => {
      const color = r.kind === "visited" ? "#C96B52" : "#9B59B6";
      // 커스텀 핀: 눈물방울 모양 div 아이콘
      const icon = L.divIcon({
        html: `
          <div style="
            width:14px; height:14px;
            border-radius: 50% 50% 50% 0;
            background:${color};
            border: 2px solid #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,.3);
            transform: rotate(-45deg);
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 14],
        className: "",
      });
      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);
      const area = r.district ? `${r.sido} ${r.district}` : r.sido;
      marker.bindPopup(`<b>${r.name}</b><br/>${area}`);
      markersRef.current.push(marker);
    });
  };
  /* ── 지도 초기화 (마운트 시 한 번) ── */
  useEffect(() => {
    // Leaflet CSS 동적 로드
    if (!document.querySelector("#leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    import("leaflet").then((L) => {
      if (mapRef.current) return; // 이미 초기화됨
      const el = document.getElementById(mapId.current);
      if (!el) return;
      const map = L.map(el, {
        center: [36.5, 127.5],
        zoom: 7,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);
      mapRef.current = map;
      updateMarkers(L, map, "all");
    });
    return () => {
      // 컴포넌트 언마운트 시 지도 제거
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  /* ── 필터 변경 시 마커 업데이트 ── */
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => updateMarkers(L, mapRef.current, filter));
  }, [filter]);
  const filterBtns: { id: Filter; label: string }[] = [
    {
      id: "all",
      label: `전체 (${visitedWithPin.length + wishWithPin.length})`,
    },
    { id: "visited", label: `방문 (${visitedWithPin.length})` },
    { id: "wish", label: `위시 (${wishWithPin.length})` },
  ];
  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-5 pb-3.5">
        <h2 className="text-xl font-extrabold text-ink mb-1">
          우리가 함께 다녀온 곳들{" "}
        </h2>
        <p className="text-sm text-muted">
          {visitedWithPin.length + wishWithPin.length}개의 맛집 추억이
          담겨있어요
        </p>
      </div>
      {/* 필터 칩 */}
      <div className="flex gap-2 px-5 mb-3.5 overflow-x-auto">
        {filterBtns.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm border shrink-0 transitionall",
              filter === id
                ? "bg-rose text-white border-rose font-semibold"
                : "bg-white text-muted border-muted-light",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {/* 지도 */}
      <div className="mx-4 rounded-2xl overflow-hidden border border-mutedlight">
        <div id={mapId.current} style={{ width: "100%", height: 460 }} />
      </div>
      {/* 범례 */}
      <div className="flex gap-5 px-5 py-3 text-xs text-muted">
        <span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose mr-1.5 align-middle" />
          방문한 곳
        </span>
        <span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5 align-middle" />
          위시리스트
        </span>
      </div>
    </div>
  );
}
