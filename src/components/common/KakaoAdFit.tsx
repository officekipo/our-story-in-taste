// src/components/common/KakaoAdFit.tsx
//
//  카카오 애드핏 320x50 배너
//  위치: BottomNav(약 60px) 바로 위 고정
//  광고 단위 ID: DAN-NL7KhtYPzCG2YUOU
"use client";

import { useEffect, useRef } from "react";

const AD_UNIT_ID = "DAN-NL7KhtYPzCG2YUOU";

export function KakaoAdFit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded     = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    isLoaded.current = true;

    if (!containerRef.current) return;
    // 이미 ins가 있으면 중복 추가 방지
    if (containerRef.current.querySelector("ins")) return;

    // ins 엘리먼트 생성
    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.setAttribute("data-ad-unit",   AD_UNIT_ID);
    ins.setAttribute("data-ad-width",  "320");
    ins.setAttribute("data-ad-height", "50");
    containerRef.current.appendChild(ins);

    // 애드핏 스크립트 로드
    const script = document.createElement("script");
    script.async = true;
    script.type  = "text/javascript";
    script.src   = "//t1.daumcdn.net/kas/static/ba.min.js";
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div style={{
      position:       "fixed",
      bottom:         60,           // BottomNav 높이
      left:           "50%",
      transform:      "translateX(-50%)",
      width:          "100%",
      maxWidth:       480,
      zIndex:         49,           // BottomNav(zIndex 50) 바로 아래
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
