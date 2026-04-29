// src/components/common/KakaoAdFitInFeed.tsx
//
//  인피드 광고 컴포넌트
//  - 리스트 아이템 사이에 인라인으로 삽입
//  - 스크립트는 페이지당 최초 1회만 로드 (모듈 레벨 플래그)
//  - 광고 차단 시 조용히 숨김
"use client";

import { useEffect, useRef, useState } from "react";

const AD_UNIT_ID = "DAN-NL7KhtYPzCG2YUOU";

// 스크립트 중복 로드 방지 — 모듈 레벨 플래그
let adScriptLoaded = false;

export function KakaoAdFitInFeed() {
  const insRef    = useRef<HTMLDivElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!insRef.current) return;

    // ins 엘리먼트 생성
    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.setAttribute("data-ad-unit",   AD_UNIT_ID);
    ins.setAttribute("data-ad-width",  "320");
    ins.setAttribute("data-ad-height", "50");
    insRef.current.appendChild(ins);

    // 스크립트 최초 1회만 로드
    if (!adScriptLoaded) {
      adScriptLoaded = true;
      const script = document.createElement("script");
      script.async = true;
      script.type  = "text/javascript";
      script.src   = "//t1.daumcdn.net/kas/static/ba.min.js";
      script.onerror = () => {
        adScriptLoaded = false;
        setBlocked(true);
      };
      document.head.appendChild(script);
    }
  }, []);

  if (blocked) return null;

  return (
    <div style={{
      width:          "100%",
      display:        "flex",
      justifyContent: "center",
      alignItems:     "center",
      padding:        "10px 0",
      background:     "#FAF7F3",
      borderRadius:   12,
      marginBottom:   14,
    }}>
      <div ref={insRef} style={{ width: 320, height: 50, overflow: "hidden" }} />
    </div>
  );
}
