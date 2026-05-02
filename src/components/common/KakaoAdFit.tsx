// src/components/common/KakaoAdFit.tsx
//
//  Performance 개선:
//    ★ IntersectionObserver로 뷰포트 진입 시에만 스크립트 로드 → LCP 영향 제거
//    ★ requestIdleCallback으로 메인 스레드 여유 시간에 실행
//  Accessibility 개선:
//    ★ aria-label, role 추가
//    ★ 광고 컨테이너 적절한 시맨틱 속성
"use client";

import { useEffect, useRef, useState } from "react";

const AD_UNIT_ID = "DAN-qujyAjN1IQufDI4a";

export function KakaoAdFit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded     = useRef(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (isLoaded.current || !containerRef.current) return;

    const load = () => {
      if (isLoaded.current || !containerRef.current) return;
      isLoaded.current = true;

      const ins = document.createElement("ins");
      ins.className = "kakao_ad_area";
      ins.style.display = "none";
      ins.setAttribute("data-ad-unit",   AD_UNIT_ID);
      ins.setAttribute("data-ad-width",  "320");
      ins.setAttribute("data-ad-height", "50");
      // ★ Accessibility: 광고 ins 요소에 aria 속성
      ins.setAttribute("aria-label", "광고");
      ins.setAttribute("aria-hidden", "false");
      containerRef.current!.appendChild(ins);

      // ★ 스크립트 중복 방지
      if (!document.querySelector('script[src*="ba.min.js"]')) {
        const script = document.createElement("script");
        script.async = true;
        script.defer = true;                          // ★ defer 추가 → 파싱 블로킹 방지
        script.type  = "text/javascript";
        script.src   = "//t1.daumcdn.net/kas/static/ba.min.js";
        script.onerror = () => setBlocked(true);
        document.head.appendChild(script);
      }
    };

    // ★ IntersectionObserver: 화면에 보일 때만 광고 로드 → LCP 점수 개선
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          // ★ requestIdleCallback: 브라우저 여유 시간에 실행
          if ("requestIdleCallback" in window) {
            requestIdleCallback(load, { timeout: 2000 });
          } else {
            setTimeout(load, 200);
          }
        }
      },
      { rootMargin: "200px" }  // 200px 전에 미리 준비
    );
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  if (blocked) return null;

  return (
    <aside
      aria-label="광고 영역"
      style={{
        width:          "100%",
        display:        "flex",
        justifyContent: "center",
        alignItems:     "center",
        background:     "#fff",
        borderTop:      "1px solid #E2DDD8",
        minHeight:      50,
        flexShrink:     0,
      }}
    >
      <div
        ref={containerRef}
        style={{ width: 320, height: 50, overflow: "hidden" }}
        aria-label="카카오 광고"
      />
    </aside>
  );
}
