// src/components/common/KakaoAdFit.tsx
//
//  Fix (탭 이동 후 광고 미노출 버그):
//    ★ 스크립트를 containerRef 내부가 아닌 document.head 에 삽입
//    ★ 매 mount 시 기존 ba.min.js 스크립트 제거 후 재삽입
//      → 탭 이동 후 remount 시 SDK 가 새 ins 요소를 재스캔하도록 강제
//    ★ unmount 시 ins 정리 (cleanup)
"use client";

import { useEffect, useRef, useState } from "react";

const AD_UNIT_ID = "DAN-qujyAjN1IQufDI4a";

export function KakaoAdFit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // ins 엘리먼트 생성
    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.setAttribute("data-ad-unit",   AD_UNIT_ID);
    ins.setAttribute("data-ad-width",  "320");
    ins.setAttribute("data-ad-height", "50");
    containerRef.current.appendChild(ins);

    // ★ 핵심 수정: 기존 ba.min.js 스크립트를 모두 제거한 뒤 재삽입
    //   → 이미 로드된 스크립트는 새 ins 요소를 인식하지 못함
    //   → 제거 후 재삽입하면 SDK 가 다시 실행되어 새 ins 를 처리함
    document.querySelectorAll('script[src*="ba.min.js"]').forEach(s => s.remove());

    const script = document.createElement("script");
    script.async = true;
    script.type  = "text/javascript";
    script.src   = "//t1.daumcdn.net/kas/static/ba.min.js";
    script.onerror = () => setBlocked(true);
    document.head.appendChild(script);  // ★ head 에 삽입 (containerRef 내부 X)

    return () => {
      // unmount 시 ins 정리 (다음 mount 에서 중복 생성 방지)
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
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
      flexShrink:     0,
    }}>
      <div ref={containerRef} style={{ width: 320, height: 50, overflow: "hidden" }} />
    </div>
  );
}
