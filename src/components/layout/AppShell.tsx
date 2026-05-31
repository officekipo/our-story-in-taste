// src/components/layout/AppShell.tsx
//
// 변경사항:
//   ★ filterBar?: React.ReactNode prop 추가
//     → Header와 <main> 사이에 렌더링
//     → page.tsx에서 필터 바 JSX를 여기로 넘김
//     → 필터 바가 헤더 높이에 영향을 주지 않아 탭 이동 시 덜컥임 없음
"use client";

import { useState, useCallback } from "react";
import { useStats }   from "@/hooks/useStats";
import { Header }     from "./Header";
import { BottomNav }  from "./BottomNav";
import { useTabAnim } from "@/app/template";

interface AppShellProps {
  children:          React.ReactNode;
  activeTab:         "visited" | "wishlist" | "map" | "stats" | "community";
  headerProps?:      Record<string, any>;
  filterBar?:        React.ReactNode;
  noPad?:            boolean;
  fab?:              React.ReactNode;
  onScrolledChange?: (scrolled: boolean) => void;
}

export function AppShell({ children, activeTab, headerProps, filterBar, noPad, fab, onScrolledChange }: AppShellProps) {
  useStats();

  const { animClass, onAnimationEnd } = useTabAnim();

  // main 스크롤 감지 → Header(scrolled) + page.tsx(onScrolledChange) 양쪽에 전달
  const [scrolled, setScrolled] = useState(false);
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const next = (e.currentTarget as HTMLElement).scrollTop > 40;
    setScrolled(next);
    onScrolledChange?.(next);
  }, [onScrolledChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, maxWidth: 480, width: "100%", margin: "0 auto", background: "var(--color-bg)", overflow: "hidden", position: "relative" }}>

      {/* 헤더 — 항상 동일한 높이, 필터 바 미포함 */}
      <Header activeTab={activeTab} scrolled={scrolled} {...(headerProps ?? {})} />

      {/* 필터 바 slot — Header와 main 사이 (다녀온 곳 탭에서만 page.tsx가 채움) */}
      {filterBar}

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
