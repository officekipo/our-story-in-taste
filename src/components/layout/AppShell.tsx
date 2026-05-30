// src/components/layout/AppShell.tsx
"use client";

import { useState, useCallback } from "react";
import { useStats }   from "@/hooks/useStats";
import { Header }     from "./Header";
import { BottomNav }  from "./BottomNav";
import { useTabAnim } from "@/app/template";

interface AppShellProps {
  children:     React.ReactNode;
  activeTab:    "visited" | "wishlist" | "map" | "stats" | "community";
  headerProps?: Record<string, any>;
  noPad?:       boolean;
  fab?:         React.ReactNode;
}

export function AppShell({ children, activeTab, headerProps, noPad, fab }: AppShellProps) {
  useStats();

  const { animClass, onAnimationEnd } = useTabAnim();

  // main 스크롤 감지 → Header에 전달
  const [scrolled, setScrolled] = useState(false);
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrolled((e.currentTarget as HTMLElement).scrollTop > 40);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, maxWidth: 480, width: "100%", margin: "0 auto", background: "var(--color-bg)", overflow: "hidden", position: "relative" }}>
      <Header activeTab={activeTab} scrolled={scrolled} {...(headerProps ?? {})} />

      <main
        className={animClass}
        onAnimationEnd={onAnimationEnd}
        onScroll={handleScroll}
        style={{ flex: 1, minHeight: 0, overflowY: noPad ? "hidden" : "auto", overflowX: "hidden", paddingBottom: noPad ? 0 : 80, display: noPad ? "flex" : "block", flexDirection: noPad ? "column" : undefined, WebkitOverflowScrolling: "touch" as any }}
      >
        {children}
      </main>

      {fab}

      <BottomNav activeTab={activeTab} />
    </div>
  );
}

export default AppShell;
