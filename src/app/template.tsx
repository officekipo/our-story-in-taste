// src/app/template.tsx
"use client";

import { usePathname }                                     from "next/navigation";
import { useRef, useLayoutEffect, useState, useCallback, createContext, useContext } from "react";

const TAB_ORDER: Record<string, number> = {
  "/":          0,
  "/wishlist":  1,
  "/map":       2,
  "/stats":     3,
  "/community": 4,
};

const SESSION_KEY = "ourtaste_prev_tab";

// ── AppShell의 main이 읽어가는 Context ────────────────────
export const TabAnimContext = createContext<{
  animClass:       string;
  onAnimationEnd:  () => void;
}>({
  animClass:      "",
  onAnimationEnd: () => {},
});

export function useTabAnim() {
  return useContext(TabAnimContext);
}

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const isTabPage = pathname in TAB_ORDER;

  const [animClass, setAnimClass] = useState("");
  const didRun = useRef(false);

  useLayoutEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    if (!isTabPage) {
      setAnimClass("page-from-right");
      return;
    }

    const curTab  = TAB_ORDER[pathname];
    const raw     = sessionStorage.getItem(SESSION_KEY);
    const prevTab = raw !== null ? parseInt(raw, 10) : null;

    if (prevTab === null || prevTab === curTab) {
      setAnimClass("");
    } else if (curTab > prevTab) {
      setAnimClass("tab-from-right");
    } else {
      setAnimClass("tab-from-left");
    }

    sessionStorage.setItem(SESSION_KEY, String(curTab));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnimationEnd = useCallback(() => {
    setAnimClass("");
  }, []);

  // ── 탭 페이지: 애니메이션을 Context로 내려보냄
  //    template div 자체는 애니메이션 없이 고정 컨테이너 역할만
  if (isTabPage) {
    return (
      <TabAnimContext.Provider value={{ animClass, onAnimationEnd: handleAnimationEnd }}>
        <div
          style={{
            width:         "100%",
            height:        "100dvh",
            display:       "flex",
            flexDirection: "column",
            overflow:      "hidden",
          }}
        >
          {children}
        </div>
      </TabAnimContext.Provider>
    );
  }

  // ── 서브 페이지: 기존과 동일하게 전체 슬라이드
  return (
    <div
      className={animClass}
      onAnimationEnd={handleAnimationEnd}
      style={{
        width:     "100%",
        minHeight: "100dvh",
      }}
    >
      {children}
    </div>
  );
}
