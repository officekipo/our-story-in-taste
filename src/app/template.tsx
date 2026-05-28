// src/app/template.tsx
"use client";

import { usePathname }                              from "next/navigation";
import { useRef, useLayoutEffect, useState, useCallback } from "react";

const TAB_ORDER: Record<string, number> = {
  "/":          0,
  "/wishlist":  1,
  "/map":       2,
  "/stats":     3,
  "/community": 4,
};

const SESSION_KEY = "ourtaste_prev_tab";

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

  // ★ 애니메이션 종료 후 클래스 제거
  // transform이 남아있으면 자식의 position:fixed가 viewport 기준이 아닌
  // 이 div를 containing block으로 삼아 팝업 위치가 어긋남
  const handleAnimationEnd = useCallback(() => {
    setAnimClass("");
  }, []);

  if (isTabPage) {
    return (
      <div
        className={animClass}
        onAnimationEnd={handleAnimationEnd}
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
    );
  }

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
