// src/components/common/KakaoAdFitInFeed.tsx
//
//  Fix:
//    ★ 슬롯 소진 시 빈 div 대신 null 반환 → 4번째 이후 광고 공백 제거
"use client";

import { useEffect, useRef, useState } from "react";

const AD_UNIT_IDS = [
  "DAN-NL7KhtYPzCG2YUOU",  // 인피드
  "DAN-wHZNvcaiHj5FXxi7",  // 인피드2
  "DAN-qujyAjN1IQufDI4a",  // 3번째
];

const usedSlots = new Set<string>();

let scriptTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleScriptReload(onError: () => void) {
  if (scriptTimer) clearTimeout(scriptTimer);
  scriptTimer = setTimeout(() => {
    scriptTimer = null;
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
  const insRef = useRef<HTMLDivElement>(null);
  const slotId = useRef<string | null>(null);

  const [blocked, setBlocked] = useState(false);
  const [status,  setStatus]  = useState<"pending" | "ready" | "noSlot">("pending");

  useEffect(() => {
    const available = AD_UNIT_IDS.find(id => !usedSlots.has(id));
    if (!available) {
      // ★ 슬롯 없음 — 공백 없이 완전히 숨김
      setStatus("noSlot");
      return;
    }
    usedSlots.add(available);
    slotId.current = available;
    setStatus("ready");

    return () => {
      if (slotId.current) {
        usedSlots.delete(slotId.current);
        slotId.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (status !== "ready" || !slotId.current || !insRef.current) return;

    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.setAttribute("data-ad-unit",   slotId.current);
    ins.setAttribute("data-ad-width",  "320");
    ins.setAttribute("data-ad-height", "50");
    insRef.current.appendChild(ins);

    scheduleScriptReload(() => setBlocked(true));

    return () => {
      if (insRef.current) insRef.current.innerHTML = "";
    };
  }, [status]);

  // ★ 슬롯 없음 또는 차단 → null (공백 0)
  if (status === "noSlot" || blocked) return null;

  // pending 상태(useEffect 실행 전) → 최소 자리 확보 후 바로 사라짐
  if (status === "pending") return null;

  return (
    <div style={{ width: "100%", background: "#FAF7F3", borderRadius: 12, marginBottom: 14, border: "1px dashed #D3D1C7", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "5px 10px 0" }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#888780", letterSpacing: "0.05em" }}>광고</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4px 0 10px" }}>
        <div ref={insRef} style={{ width: 320, height: 50, overflow: "hidden" }} />
      </div>
    </div>
  );
}
