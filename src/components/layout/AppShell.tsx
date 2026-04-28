// ============================================================
//  AppShell.tsx  적용 경로: src/components/layout/AppShell.tsx
//
//  수정사항:
//    ★ paddingBottom 80 → 140
//      이유: 애드핏 배너(50px) + 여백(10px) 추가로
//            콘텐츠가 광고에 가려지지 않도록 하단 여백 확보
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
        paddingBottom: noPad ? 0 : 140, // ★ 80 → 140 (광고 배너 60px 추가 확보)
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
