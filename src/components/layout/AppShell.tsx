// src/components/layout/AppShell.tsx
//
//  Accessibility 개선:
//    ★ <main>에 id 추가 → skip navigation 링크 대상
//    ★ skip to content 링크 추가 → 키보드 사용자 접근성
"use client";

import { useStats }  from "@/hooks/useStats";
import { Header }    from "./Header";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children:     React.ReactNode;
  activeTab:    "visited" | "wishlist" | "map" | "stats" | "community";
  headerProps?: Record<string, any>;
  noPad?:       boolean;
}

export function AppShell({ children, activeTab, headerProps, noPad }: AppShellProps) {
  useStats();

  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      height:        "100dvh",
      maxWidth:      480,
      margin:        "0 auto",
      background:    "var(--bg)",
      overflow:      "hidden",
    }}>
      {/* ★ Skip Navigation: 키보드/스크린리더 사용자용 */}
      <a
        href="#main-content"
        style={{
          position:  "absolute",
          top:       -100,
          left:      0,
          zIndex:    9999,
          padding:   "8px 16px",
          background: "#C96B52",
          color:     "#fff",
          fontSize:  14,
          borderRadius: "0 0 8px 0",
          // 포커스 시에만 표시
          outline:   "none",
        }}
        onFocus={e => { (e.target as HTMLElement).style.top = "0"; }}
        onBlur={e  => { (e.target as HTMLElement).style.top = "-100px"; }}
      >
        본문으로 바로가기
      </a>

      <Header activeTab={activeTab} {...(headerProps ?? {})} />

      <main
        id="main-content"              // ★ skip nav 대상
        tabIndex={-1}                  // ★ 프로그래매틱 포커스 허용
        style={{
          flex:          1,
          minHeight:     0,
          overflowY:     noPad ? "hidden" : "auto",
          paddingBottom: noPad ? 0 : 80,
          display:       noPad ? "flex" : "block",
          flexDirection: noPad ? "column" : undefined,
          outline:       "none",       // ★ tabIndex로 인한 포커스 링 제거
        }}
      >
        {children}
      </main>

      <BottomNav activeTab={activeTab} />
    </div>
  );
}

export default AppShell;
