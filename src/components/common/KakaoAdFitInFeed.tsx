// src/components/common/KakaoAdFitInFeed.tsx
//
//  Performance 개선:
//    ★ IntersectionObserver로 뷰포트 진입 시에만 스크립트 로드 → LCP 영향 제거
//    ★ script defer 추가 → 메인 스레드 파싱 블로킹 방지
//  Accessibility 개선:
//    ★ aside + aria-label로 광고 영역 명시
"use client";

import { useEffect, useRef, useState } from "react";

const AD_UNIT_IDS = [
  "DAN-NL7KhtYPzCG2YUOU", // 인피드 1
  "DAN-wHZNvcaiHj5FXxi7", // 인피드 2
];

let usedSlots: Set<string> = new Set();

export function KakaoAdFitInFeed() {
  const insRef  = useRef<HTMLDivElement>(null);
  const slotId  = useRef<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [ready,   setReady]   = useState(false);

  // 슬롯 점유
  useEffect(() => {
    const availableSlot = AD_UNIT_IDS.find(id => !usedSlots.has(id));
    if (!availableSlot) return;

    usedSlots.add(availableSlot);
    slotId.current = availableSlot;
    setReady(true);

    return () => {
      if (slotId.current) {
        usedSlots.delete(slotId.current);
        slotId.current = null;
      }
    };
  }, []);

  // 광고 로드 (뷰포트 진입 시)
  useEffect(() => {
    if (!ready || !slotId.current || !insRef.current) return;

    const load = () => {
      if (!insRef.current || !slotId.current) return;

      const ins = document.createElement("ins");
      ins.className = "kakao_ad_area";
      ins.style.display = "none";
      ins.setAttribute("data-ad-unit",   slotId.current);
      ins.setAttribute("data-ad-width",  "320");
      ins.setAttribute("data-ad-height", "50");
      ins.setAttribute("aria-label",     "광고");
      insRef.current.appendChild(ins);

      if (!document.querySelector('script[src*="ba.min.js"]')) {
        const script = document.createElement("script");
        script.async  = true;
        script.defer  = true;
        script.type   = "text/javascript";
        script.src    = "//t1.daumcdn.net/kas/static/ba.min.js";
        script.onerror = () => setBlocked(true);
        document.head.appendChild(script);
      }
    };

    // ★ IntersectionObserver: 뷰포트 진입 시 로드
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          if ("requestIdleCallback" in window) {
            requestIdleCallback(load, { timeout: 2000 });
          } else {
            setTimeout(load, 200);
          }
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(insRef.current);

    return () => observer.disconnect();
  }, [ready]);

  if (blocked) return null;

  if (!ready) {
    return <div aria-hidden="true" style={{ width: "100%", height: 70, marginBottom: 14 }} />;
  }

  return (
    <aside
      aria-label="광고 영역"
      style={{
        width:          "100%",
        display:        "flex",
        justifyContent: "center",
        alignItems:     "center",
        padding:        "10px 0",
        background:     "#FAF7F3",
        borderRadius:   12,
        marginBottom:   14,
      }}
    >
      <div
        ref={insRef}
        style={{ width: 320, height: 50, overflow: "hidden" }}
        aria-label="카카오 인피드 광고"
      />
    </aside>
  );
}
