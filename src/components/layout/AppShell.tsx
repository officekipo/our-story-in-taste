// src/components/layout/AppShell.tsx
"use client";

import { useStats }       from "@/hooks/useStats";
import { Header }         from "./Header";
import { BottomNav }      from "./BottomNav";
import { useTabAnim }     from "@/app/template";

interface AppShellProps {
  children:     React.ReactNode;
  activeTab:    "visited" | "wishlist" | "map" | "stats" | "community";
  headerProps?: Record<string, any>;
  noPad?:       boolean;
  /** position:fixed FAB 버튼 — main 밖에 렌더링해서 슬라이드 애니메이션 영향 차단 */
  fab?:         React.ReactNode;
}

export function AppShell({ children, activeTab, headerProps, noPad, fab }: AppShellProps) {
  useStats();

  const { animClass, onAnimationEnd } = useTabAnim();

  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      flex:          1,
      minHeight:     0,
      maxWidth:      480,
      width:         "100%",
      margin:        "0 auto",
      background:    "var(--color-bg)",
      overflow:      "hidden",
      position:      "relative",
    }}>
      {/* Header — 애니메이션 없음, 고정 */}
      <Header activeTab={activeTab} {...(headerProps ?? {})} />

      {/* main — 탭 전환 시 이 영역만 슬라이드 */}
      <main
        className={animClass}
        onAnimationEnd={onAnimationEnd}
        style={{
          flex:          1,
          minHeight:     0,
          overflowY:     noPad ? "hidden" : "auto",
          overflowX:     "hidden",
          paddingBottom: noPad ? 0 : 80,
          display:       noPad ? "flex" : "block",
          flexDirection: noPad ? "column" : undefined,
          WebkitOverflowScrolling: "touch" as any,
        }}
      >
        {children}
      </main>

      {/* FAB — main 밖에서 렌더링 → 슬라이드 애니메이션에 영향받지 않음 */}
      {fab}

      {/* BottomNav — 애니메이션 없음, 고정 */}
      <BottomNav activeTab={activeTab} />
    </div>
  );
}

export default AppShell;
