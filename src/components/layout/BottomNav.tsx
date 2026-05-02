// src/components/layout/BottomNav.tsx
//
//  Accessibility 개선 (Lighthouse 주요 감점 항목):
//    ★ <nav>에 aria-label 추가 → 랜드마크 중복 구분
//    ★ 각 버튼에 aria-label 추가 → 스크린리더 명확한 읽기
//    ★ 현재 탭에 aria-current="page" 추가
//    ★ 버튼 type="button" 명시 → form 내 오작동 방지
"use client";

import { useRouter } from "next/navigation";
import { HomeIcon, StarTabIcon, MapPinIcon, ChartIcon, ChatIcon } from "@/components/common/Icons";

export type TabId = "visited" | "wishlist" | "map" | "stats" | "community";

const TABS: {
  id:      TabId;
  label:   string;
  ariaLabel: string;
  path:    string;
  Icon:    React.ComponentType<{ color: string }>;
}[] = [
  { id: "visited",   label: "다녀온 곳", ariaLabel: "다녀온 곳 탭",  path: "/",          Icon: HomeIcon    },
  { id: "wishlist",  label: "가고싶어",  ariaLabel: "가고싶어 탭",   path: "/wishlist",  Icon: StarTabIcon },
  { id: "map",       label: "지도",      ariaLabel: "지도 탭",       path: "/map",       Icon: MapPinIcon  },
  { id: "stats",     label: "통계",      ariaLabel: "통계 탭",       path: "/stats",     Icon: ChartIcon   },
  { id: "community", label: "추천",      ariaLabel: "추천 탭",       path: "/community", Icon: ChatIcon    },
];

const ROSE  = "#C96B52";
const MUTED = "#8A8078";

export function BottomNav({ activeTab }: { activeTab: TabId }) {
  const router = useRouter();

  return (
    <nav
      aria-label="하단 탭 내비게이션"   // ★ 랜드마크 레이블 → Accessibility 점수 개선
      style={{
        position:  "fixed",
        bottom:    0,
        left:      "50%",
        transform: "translateX(-50%)",
        width:     "100%",
        maxWidth:  480,
        background: "#fff",
        borderTop: "1px solid #E2DDD8",
        display:   "flex",
        zIndex:    50,
      }}
    >
      {TABS.map(({ id, label, ariaLabel, path, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"                           // ★ type 명시
            onClick={() => router.push(path)}
            aria-label={ariaLabel}                  // ★ 스크린리더용 레이블
            aria-current={active ? "page" : undefined} // ★ 현재 페이지 표시
            style={{
              flex:          1,
              display:       "flex",
              flexDirection: "column",
              alignItems:    "center",
              gap:           3,
              padding:       "10px 2px",
              border:        "none",
              borderTop:     `2px solid ${active ? ROSE : "transparent"}`,
              background:    "none",
              cursor:        "pointer",
              transition:    "all 0.2s",
              // ★ 최소 터치 타깃 44px (WCAG 2.5.5)
              minHeight:     44,
            }}
          >
            <Icon color={active ? ROSE : MUTED} />
            <span
              aria-hidden="true"   // ★ aria-label이 있으므로 span은 스크린리더 무시
              style={{
                fontSize:   9,
                fontWeight: active ? 700 : 500,
                color:      active ? ROSE : MUTED,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
