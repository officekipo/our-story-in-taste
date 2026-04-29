// src/components/common/KakaoAdFit.tsx
//
//  Fix:
//    ★ 광고 스크립트 로드 실패(차단) 시 오류 대신 조용히 숨김 처리
//      → ERR_BLOCKED_BY_CLIENT 등 네트워크 오류 콘솔 오류 억제
//      → 광고 차단 시 배너 영역 자체를 숨겨 빈 공간 제거
"use client";

import { useEffect, useRef, useState } from "react";

const AD_UNIT_ID = "DAN-NL7KhtYPzCG2YUOU";

export function KakaoAdFit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded     = useRef(false);
  const [blocked,    setBlocked] = useState(false); // ★ 차단 여부

  useEffect(() => {
    if (isLoaded.current) return;
    isLoaded.current = true;
    if (!containerRef.current) return;

    // ins 엘리먼트 생성
    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.setAttribute("data-ad-unit",   AD_UNIT_ID);
    ins.setAttribute("data-ad-width",  "320");
    ins.setAttribute("data-ad-height", "50");
    containerRef.current.appendChild(ins);

    // ★ 스크립트 로드 실패 시 배너 숨김
    const script = document.createElement("script");
    script.async = true;
    script.type  = "text/javascript";
    script.src   = "//t1.daumcdn.net/kas/static/ba.min.js";
    script.onerror = () => {
      // 광고 차단기에 의해 차단된 경우 → 배너 영역 숨김
      setBlocked(true);
    };
    containerRef.current.appendChild(script);
  }, []);

  // ★ 광고 차단 시 배너 자체를 렌더하지 않음
  if (blocked) return null;

  return (
    <div style={{
      position:       "fixed",
      bottom:         60,
      left:           "50%",
      transform:      "translateX(-50%)",
      width:          "100%",
      maxWidth:       480,
      zIndex:         49,
      display:        "flex",
      justifyContent: "center",
      alignItems:     "center",
      background:     "#fff",
      borderTop:      "1px solid #E2DDD8",
      minHeight:      50,
    }}>
      <div ref={containerRef} style={{ width: 320, height: 50, overflow: "hidden" }} />
    </div>
  );
}
