// src/components/layout/AppShell.tsx
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
      flex:          1,
      minHeight:     0,
      maxWidth:      480,
      width:         "100%",
      margin:        "0 auto",
      background:    "var(--color-bg)", // ★ --bg → --color-bg (CSS 변수명 수정)
      overflow:      "hidden",
      position:      "relative",
    }}>
      <Header activeTab={activeTab} {...(headerProps ?? {})} />

      <main style={{
        flex:          1,
        minHeight:     0,
        overflowY:     noPad ? "hidden" : "auto",
        overflowX:     "hidden",
        paddingBottom: noPad ? 0 : 80,
        display:       noPad ? "flex" : "block",
        flexDirection: noPad ? "column" : undefined,
        WebkitOverflowScrolling: "touch" as any,
      }}>
        {children}
      </main>

      <BottomNav activeTab={activeTab} />
    </div>
  );
}

export default AppShell;
