// src/components/layout/AppShell.tsx
//
//  수정사항:
//    ★ KakaoAdFit 제거 — 인피드 방식으로 전환으로 불필요
//    ★ paddingBottom 원복 80
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
      <Header activeTab={activeTab} {...(headerProps ?? {})} />

      <main style={{
        flex:          1,
        minHeight:     0,
        overflowY:     noPad ? "hidden" : "auto",
        paddingBottom: noPad ? 0 : 80,
        display:       noPad ? "flex" : "block",
        flexDirection: noPad ? "column" : undefined,
      }}>
        {children}
      </main>

      <BottomNav activeTab={activeTab} />
    </div>
  );
}

export default AppShell;
