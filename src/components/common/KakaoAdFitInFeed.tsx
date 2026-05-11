// src/components/common/KakaoAdFitInFeed.tsx
//
//  Fix:
//    ★ 카카오 AdFit 규정: 동일 슬롯 ID는 페이지에 1개만 허용
//    ★ 인피드 슬롯 2개를 번갈아 사용 (최대 2개 광고 노출)
//    ★ 3번째 이상 인스턴스는 빈 영역으로 처리 (레이아웃 유지)
//    ★ 페이지 언마운트 시 슬롯 사용 상태 초기화
//    ★ [Fix #3] 광고 레이블 + 점선 테두리 추가 → 콘텐츠와 시각적 구분
"use client";

import { useEffect, useRef, useState } from "react";

// 카카오 AdFit 콘솔에서 발급받은 인피드 슬롯 ID 목록
const AD_UNIT_IDS = [
  "DAN-NL7KhtYPzCG2YUOU", // 인피드 1
  "DAN-wHZNvcaiHj5FXxi7", // 인피드 2
];

// 모듈 레벨 상태: 현재 사용 중인 슬롯 인덱스 추적
// (페이지 내 여러 인스턴스가 서로 다른 슬롯을 나눠 씀)
let usedSlots: Set<string> = new Set();

export function KakaoAdFitInFeed() {
  const insRef    = useRef<HTMLDivElement>(null);
  const slotId    = useRef<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    // 사용 가능한 슬롯 찾기
    const availableSlot = AD_UNIT_IDS.find(id => !usedSlots.has(id));

    if (!availableSlot) {
      // 슬롯이 모두 사용 중 → 이 인스턴스는 빈 영역으로
      return;
    }

    // 슬롯 점유
    usedSlots.add(availableSlot);
    slotId.current = availableSlot;
    setReady(true);

    return () => {
      // 언마운트 시 슬롯 반납 (페이지 이동 후 재진입 대비)
      if (slotId.current) {
        usedSlots.delete(slotId.current);
        slotId.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || !slotId.current || !insRef.current) return;

    // ins 엘리먼트 생성
    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.setAttribute("data-ad-unit",   slotId.current);
    ins.setAttribute("data-ad-width",  "320");
    ins.setAttribute("data-ad-height", "50");
    insRef.current.appendChild(ins);

    // 스크립트는 페이지당 최초 1회만 로드
    if (!document.querySelector('script[src*="ba.min.js"]')) {
      const script = document.createElement("script");
      script.async  = true;
      script.type   = "text/javascript";
      script.src    = "//t1.daumcdn.net/kas/static/ba.min.js";
      script.onerror = () => setBlocked(true);
      document.head.appendChild(script);
    }
  }, [ready]);

  if (blocked) return null;

  // 슬롯이 없는 인스턴스 → 빈 영역 (레이아웃 틀어짐 방지)
  if (!ready) {
    return <div style={{ width: "100%", height: 70, marginBottom: 14 }} />;
  }

  return (
    <div style={{
      width:        "100%",
      background:   "#FAF7F3",
      borderRadius: 12,
      marginBottom: 14,
      border:       "1px dashed #D3D1C7",   // ★ Fix #3: 점선 테두리로 콘텐츠와 구분
      overflow:     "hidden",
    }}>
      {/* ★ Fix #3: 광고 구분 레이블 */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "5px 10px 0" }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#888780", letterSpacing: "0.05em" }}>광고</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4px 0 10px" }}>
        <div ref={insRef} style={{ width: 320, height: 50, overflow: "hidden" }} />
      </div>
    </div>
  );
}
