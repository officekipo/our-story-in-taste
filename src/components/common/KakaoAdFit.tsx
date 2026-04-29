// src/components/common/KakaoAdFit.tsx
//
//  Fix:
//    ★ position fixed 제거 → AppShell 안에서 BottomNav 바로 위에 렌더
//      → BottomNav 없는 페이지(설정, 인증 등)에는 표시 안 됨
//    ★ 광고 차단 시 스크립트 onerror → null 반환으로 조용히 숨김
"use client";

import { useEffect, useRef, useState } from "react";

const AD_UNIT_ID = "DAN-NL7KhtYPzCG2YUOU";

export function KakaoAdFit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded     = useRef(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (isLoaded.current) return;
    isLoaded.current = true;
    if (!containerRef.current) return;

    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.setAttribute("data-ad-unit",   AD_UNIT_ID);
    ins.setAttribute("data-ad-width",  "320");
    ins.setAttribute("data-ad-height", "50");
    containerRef.current.appendChild(ins);

    const script = document.createElement("script");
    script.async = true;
    script.type  = "text/javascript";
    script.src   = "//t1.daumcdn.net/kas/static/ba.min.js";
    script.onerror = () => setBlocked(true);
    containerRef.current.appendChild(script);
  }, []);

  if (blocked) return null;

  return (
    <div style={{
      width:          "100%",
      display:        "flex",
      justifyContent: "center",
      alignItems:     "center",
      background:     "#fff",
      borderTop:      "1px solid #E2DDD8",
      minHeight:      50,
      flexShrink:     0,   // flex 자식으로 사용 시 찌그러지지 않도록
    }}>
      <div ref={containerRef} style={{ width: 320, height: 50, overflow: "hidden" }} />
    </div>
  );
}
