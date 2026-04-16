// ============================================================
//  KakaoPlaceSearch.tsx
//  적용 경로: src/components/common/KakaoPlaceSearch.tsx
//
//  Fix: Modal 안에서 드롭다운이 잘리는 문제 해결
//    - dropdownTarget: document.body 에 Portal 로 렌더링
//    - 입력 필드 위치 계산해서 드롭다운 절대 위치 지정
//
//  Fix2: category_group_code 복수 값(FD6,CE7) → 400 오류 수정
//    - FD6(음식점) / CE7(카페) 를 Promise.all 로 각각 호출 후 병합
//    - query.trim() 으로 검색어 끝 공백 제거
// ============================================================
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const INK   = "#1A1412";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";
const WARM  = "#FAF7F3";

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_KEY ?? "";

function parseSido(address: string): string {
  const map: Record<string, string> = {
    "서울": "서울", "부산": "부산", "대구": "대구", "인천": "인천",
    "광주": "광주", "대전": "대전", "울산": "울산", "세종": "세종",
    "경기": "경기", "강원": "강원", "충청북도": "충북", "충청남도": "충남",
    "전라북도": "전북", "전라남도": "전남", "경상북도": "경북", "경상남도": "경남", "제주": "제주",
  };
  for (const [k, v] of Object.entries(map)) {
    if (address.startsWith(k)) return v;
  }
  return "기타";
}

function parseCuisine(category: string): string {
  if (category.includes("한식"))    return "한식";
  if (category.includes("일식"))    return "일식";
  if (category.includes("중식"))    return "중식";
  if (category.includes("양식"))    return "양식";
  if (category.includes("분식"))    return "분식";
  if (category.includes("카페")||category.includes("디저트")) return "카페/디저트";
  if (category.includes("패스트"))  return "패스트푸드";
  if (category.includes("치킨")||category.includes("피자"))  return "치킨/피자";
  if (category.includes("해산물"))  return "해산물";
  if (category.includes("고기")||category.includes("구이"))  return "고기/구이";
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
  value:    string;
  onChange: (v: string) => void;
  onSelect: (place: KakaoPlace) => void;
  style?:   React.CSSProperties;
}

export function KakaoPlaceSearch({ value, onChange, onSelect, style }: Props) {
  const [results,   setResults]   = useState<KakaoPlace[]>([]);
  const [open,      setOpen]      = useState(false);
  const [searching, setSearching] = useState(false);
  const [dropPos,   setDropPos]   = useState({ top: 0, left: 0, width: 0 });

  const inputRef  = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 드롭다운 위치 계산
  const calcPos = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropPos({
      top:   rect.bottom + window.scrollY + 4,
      left:  rect.left   + window.scrollX,
      width: rect.width,
    });
  }, []);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        const el = e.target as HTMLElement;
        if (!el.closest("[data-kakao-drop]")) setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 카테고리 1개씩 호출 (카카오 API는 category_group_code 단일 값만 허용)
  const fetchByCategory = async (keyword: string, code: string): Promise<KakaoPlace[]> => {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json` +
      `?query=${encodeURIComponent(keyword.trim())}` +
      `&category_group_code=${code}` +
      `&size=5`,
      { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.documents ?? []).map((d: any) => ({
      name:     d.place_name,
      sido:     parseSido(d.address_name),
      district: d.address_name.split(" ").slice(1, 3).join(" "),
      cuisine:  parseCuisine(d.category_name ?? ""),
      lat:      parseFloat(d.y),
      lng:      parseFloat(d.x),
      address:  d.address_name,
    }));
  };

  const search = async (keyword: string) => {
    if (!keyword.trim() || keyword.length < 2) { setResults([]); setOpen(false); return; }
    if (!KAKAO_KEY) {
      console.warn("NEXT_PUBLIC_KAKAO_REST_KEY 가 설정되지 않았습니다.");
      return;
    }
    setSearching(true);
    try {
      // FD6(음식점) + CE7(카페) 병렬 호출 후 최대 8개 병합
      const [restaurants, cafes] = await Promise.all([
        fetchByCategory(keyword, "FD6"),
        fetchByCategory(keyword, "CE7"),
      ]);
      const places = [...restaurants, ...cafes].slice(0, 8);
      setResults(places);
      if (places.length > 0) { calcPos(); setOpen(true); }
      else setOpen(false);
    } catch (e) {
      console.error("카카오 검색 오류:", e);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (v: string) => {
    onChange(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 400);
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

  // 드롭다운을 Portal 로 body 에 렌더링 → Modal overflow:hidden 영향 없음
  const dropdown = open && results.length > 0 ? createPortal(
    <div
      data-kakao-drop="true"
      style={{
        position: "absolute",
        top:    dropPos.top,
        left:   dropPos.left,
        width:  dropPos.width,
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        boxShadow: "0 6px 24px rgba(0,0,0,0.14)",
        zIndex: 99999,
        maxHeight: 260,
        overflowY: "auto",
      }}
    >
      {results.map((place, i) => (
        <button
          key={i}
          onMouseDown={(e) => { e.preventDefault(); handleSelect(place); }}
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
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (results.length > 0) { calcPos(); setOpen(true); } }}
        placeholder="식당 이름 검색 (예: 을지로 이자카야)"
        style={inp}
      />
      {searching && (
        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: MUTED, pointerEvents: "none" }}>
          검색 중…
        </div>
      )}
      {dropdown}
    </div>
  );
}
