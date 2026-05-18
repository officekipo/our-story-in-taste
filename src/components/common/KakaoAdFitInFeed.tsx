// src/components/common/KakaoAdFitInFeed.tsx
//
//  Fix (탭 이동 후 광고 미노출 버그):
//    ★ [핵심] "스크립트가 이미 있으면 skip" 가드 제거
//      → 이 가드가 탭 복귀 시 SDK 재실행을 막아 새 ins 요소가 처리되지 않던 원인
//    ★ 모든 인스턴스 중 가장 마지막에 mount 된 것이 스크립트 재삽입 담당
//      → scriptTimer 로 16ms 디바운스: 같은 프레임에 여러 인스턴스가 마운트되어도
//         스크립트 교체가 딱 1회만 일어나도록 조율
//    ★ unmount 시 ins 정리
"use client";

import { useEffect, useRef, useState } from "react";

const AD_UNIT_IDS = [
  "DAN-NL7KhtYPzCG2YUOU",
  "DAN-wHZNvcaiHj5FXxi7",
];

// 모듈 레벨 슬롯 추적 (페이지 내 중복 방지)
let usedSlots: Set<string> = new Set();

// 스크립트 교체 디바운스 타이머
// (같은 렌더 사이클에서 여러 인스턴스가 동시에 mount 될 때 1회만 교체)
let scriptTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleScriptReload(onError: () => void) {
  if (scriptTimer) clearTimeout(scriptTimer);
  scriptTimer = setTimeout(() => {
    scriptTimer = null;
    // ★ 핵심 수정: 기존 스크립트 제거 후 재삽입으로 SDK 재초기화
    document.querySelectorAll('script[src*="ba.min.js"]').forEach(s => s.remove());
    const script = document.createElement("script");
    script.async   = true;
    script.type    = "text/javascript";
    script.src     = "//t1.daumcdn.net/kas/static/ba.min.js";
    script.onerror = onError;
    document.head.appendChild(script);
  }, 16);
}

export function KakaoAdFitInFeed() {
  const insRef   = useRef<HTMLDivElement>(null);
  const slotId   = useRef<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    const availableSlot = AD_UNIT_IDS.find(id => !usedSlots.has(id));
    if (!availableSlot) return;   // 슬롯 소진 → 빈 영역 유지

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

    // ★ 스크립트 재로드 예약 (디바운스로 1회만 실행)
    scheduleScriptReload(() => setBlocked(true));

    return () => {
      if (insRef.current) {
        insRef.current.innerHTML = "";
      }
    };
  }, [ready]);

  if (blocked) return null;

  if (!ready) {
    return <div style={{ width: "100%", height: 70, marginBottom: 14 }} />;
  }

  return (
    <div style={{
      width:        "100%",
      background:   "#FAF7F3",
      borderRadius: 12,
      marginBottom: 14,
      border:       "1px dashed #D3D1C7",
      overflow:     "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "5px 10px 0" }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#888780", letterSpacing: "0.05em" }}>광고</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4px 0 10px" }}>
        <div ref={insRef} style={{ width: 320, height: 50, overflow: "hidden" }} />
      </div>
    </div>
  );
}
