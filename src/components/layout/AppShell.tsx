// ============================================================
//  AppShell.tsx  적용 경로: src/components/layout/AppShell.tsx
//
//  Fix: height:100dvh + overflow:hidden → 지도 높이 100% 해결
// ============================================================
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
      display:        "flex",
      flexDirection:  "column",
      height:         "100dvh",      // ★ min-height → height 변경
      maxWidth:       480,
      margin:         "0 auto",
      background:     "var(--bg)",
      overflow:       "hidden",      // ★ 스크롤 AppShell 레벨에서 차단
    }}>
      <Header activeTab={activeTab} {...(headerProps ?? {})} />

      <main style={{
        flex:           1,
        minHeight:      0,           // ★ flex 자식이 부모를 넘치지 않도록
        overflowY:      noPad ? "hidden" : "auto",
        paddingBottom:  noPad ? 0 : 80,
        display:        noPad ? "flex" : "block",
        flexDirection:  noPad ? "column" : undefined,
      }}>
        {children}
      </main>

      <BottomNav activeTab={activeTab} />
    </div>
  );
}

export default AppShell;
