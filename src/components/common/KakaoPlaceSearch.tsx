// ============================================================
//  KakaoPlaceSearch.tsx
//  적용 경로: src/components/common/KakaoPlaceSearch.tsx
//
//  사용법 (AddEditModal.tsx 와 WishModal.tsx 에서):
//
//  import { KakaoPlaceSearch } from "@/components/common/KakaoPlaceSearch";
//
//  <KakaoPlaceSearch
//    value={name}
//    onChange={setName}
//    onSelect={(place) => {
//      setName(place.name);
//      setSido(place.sido);
//      setDistrict(place.district);
//      setCuisine(place.cuisine);
//      setLat(place.lat);
//      setLng(place.lng);
//    }}
//  />
// ============================================================
"use client";

import { useState, useRef, useEffect } from "react";

const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";
const ROSE   = "#C96B52";

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_KEY ?? "";

// 시도 이름 정규화 (카카오 주소 → 앱 SIDO 상수)
function parseSido(address: string): string {
  const map: Record<string, string> = {
    "서울": "서울", "부산": "부산", "대구": "대구", "인천": "인천",
    "광주": "광주", "대전": "대전", "울산": "울산", "세종": "세종",
    "경기": "경기", "강원": "강원", "충청북도": "충북", "충청남도": "충남",
    "전라북도": "전북", "전라남도": "전남", "경상북도": "경북", "경상남도": "경남",
    "제주": "제주",
  };
  for (const [k, v] of Object.entries(map)) {
    if (address.startsWith(k)) return v;
  }
  return "기타";
}

// 카카오 카테고리 → 앱 CUISINES 매핑
function parseCuisine(category: string): string {
  if (category.includes("한식"))          return "한식";
  if (category.includes("일식"))          return "일식";
  if (category.includes("중식"))          return "중식";
  if (category.includes("양식"))          return "양식";
  if (category.includes("분식"))          return "분식";
  if (category.includes("카페") || category.includes("디저트")) return "카페/디저트";
  if (category.includes("패스트푸드"))    return "패스트푸드";
  if (category.includes("치킨") || category.includes("피자"))  return "치킨/피자";
  if (category.includes("해산물"))        return "해산물";
  if (category.includes("고기") || category.includes("구이"))  return "고기/구이";
  return "기타";
}

export interface KakaoPlace {
  name:     string;
  sido:     string;
  district: string;
  cuisine:  string;
  lat:      number;
  lng:      number;
  address:  string;
}

interface Props {
  value:     string;
  onChange:  (v: string) => void;
  onSelect:  (place: KakaoPlace) => void;
  style?:    React.CSSProperties;
}

export function KakaoPlaceSearch({ value, onChange, onSelect, style }: Props) {
  const [results,  setResults]  = useState<KakaoPlace[]>([]);
  const [open,     setOpen]     = useState(false);
  const [searching,setSearching]= useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapRef  = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (keyword: string) => {
    if (!keyword.trim() || keyword.length < 2) { setResults([]); setOpen(false); return; }
    setSearching(true);
    try {
      const res  = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}&category_group_code=FD6,CE7&size=8`,
        { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
      );
      const data = await res.json();
      const places: KakaoPlace[] = (data.documents ?? []).map((d: any) => ({
        name:     d.place_name,
        sido:     parseSido(d.address_name),
        district: d.address_name.split(" ").slice(1, 3).join(" "),
        cuisine:  parseCuisine(d.category_name),
        lat:      parseFloat(d.y),
        lng:      parseFloat(d.x),
        address:  d.address_name,
      }));
      setResults(places);
      setOpen(places.length > 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (v: string) => {
    onChange(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 350); // 350ms 디바운스
  };

  const handleSelect = (place: KakaoPlace) => {
    onChange(place.name);
    onSelect(place);
    setOpen(false);
    setResults([]);
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 13px",
    background: WARM, border: `1px solid ${BORDER}`,
    borderRadius: 10, color: INK, fontSize: 14,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
    ...style,
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="예: 을지로 이자카야 (검색하면 위치 자동 입력)"
        style={inp}
      />
      {searching && (
        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: MUTED }}>
          검색 중…
        </div>
      )}

      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 999,
          maxHeight: 240, overflowY: "auto",
        }}>
          {results.map((place, i) => (
            <button
              key={i}
              onClick={() => handleSelect(place)}
              style={{
                width: "100%", padding: "11px 14px", border: "none",
                background: "none", textAlign: "left", cursor: "pointer",
                borderBottom: i < results.length - 1 ? `1px solid ${BORDER}` : "none",
                fontFamily: "inherit",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{place.name}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                📍 {place.address} · {place.cuisine}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
