// src/app/offline/page.tsx
"use client";

import { useEffect, useState } from "react";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const ROSE_DK = "#8C4A38";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const BG      = "#F5F0EB";
const CREAM   = "#F0EBE3";

export default function OfflinePage() {
  const [dots, setDots]       = useState(0);
  const [ripple, setRipple]   = useState(0);
  const [btnHover, setBtnHover] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setRipple(r => r + 1), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleOnline = () => window.location.reload();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const dotStr = "•".repeat(dots) + "◦".repeat(3 - dots);

  return (
    <div style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", fontFamily: '"Pretendard", -apple-system, sans-serif', position: "relative", overflow: "hidden" }}>

      {/* 배경 장식 원 */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: ROSE_LT, opacity: 0.3, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: CREAM, pointerEvents: "none" }} />

      {/* 로고 */}
      <div style={{ marginBottom: 40, display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          <rect x="9.5"  y="8.5"  width="2"  height="6.5" rx="1" fill={ROSE} />
          <rect x="13"   y="8.5"  width="2"  height="6.5" rx="1" fill={ROSE} />
          <rect x="16.5" y="8.5"  width="2"  height="6.5" rx="1" fill={ROSE} />
          <rect x="9.5"  y="15"   width="9"  height="1.8" rx="0.9" fill={ROSE} />
          <rect x="13"   y="16.5" width="2"  height="14"  rx="1" fill={ROSE} />
          <path d="M27.5 20.5C27.5 20.5 22 16.5 22 13.2C22 11.3 23.6 10 25.4 10C26.5 10 27.5 10.9 27.5 10.9C27.5 10.9 28.5 10 29.6 10C31.4 10 33 11.3 33 13.2C33 16.5 27.5 20.5 27.5 20.5Z" fill={ROSE} />
        </svg>
        <span style={{ fontSize: 15, fontWeight: 700, color: ROSE, letterSpacing: "-0.3px" }}>우리의 맛지도</span>
      </div>

      {/* 메인 일러스트 영역 */}
      <div style={{ position: "relative", width: 160, height: 160, marginBottom: 36 }}>

        {/* 리플 애니메이션 */}
        <div key={`r1-${ripple}`} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1.5px solid ${ROSE}`, opacity: 0, animation: "rippleOut 2s ease-out forwards" }} />
        <div key={`r2-${ripple}`} style={{ position: "absolute", inset: -18, borderRadius: "50%", border: `1px solid ${ROSE}`, opacity: 0, animation: "rippleOut 2s ease-out 0.4s forwards" }} />
        <div key={`r3-${ripple}`} style={{ position: "absolute", inset: -36, borderRadius: "50%", border: `1px solid ${ROSE}`, opacity: 0, animation: "rippleOut 2s ease-out 0.8s forwards" }} />

        {/* 중앙 원 */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: WARM, border: `1.5px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>

          {/* 와이파이 슬래시 아이콘 */}
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            {/* 와이파이 호 3개 */}
            <path d="M8 22C13.6 16.4 21.4 13 26 13C30.6 13 38.4 16.4 44 22" stroke={BORDER} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M13 27.5C17.2 23.3 21.8 21 26 21C30.2 21 34.8 23.3 39 27.5" stroke={BORDER} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M18.5 33C20.8 30.7 23.4 29.5 26 29.5C28.6 29.5 31.2 30.7 33.5 33" stroke={BORDER} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* 중앙 점 */}
            <circle cx="26" cy="39" r="2.5" fill={BORDER} />
            {/* 슬래시 선 */}
            <line x1="10" y1="10" x2="42" y2="42" stroke={ROSE} strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          <span style={{ fontSize: 11, color: MUTED, fontWeight: 600, letterSpacing: "0.5px" }}>OFFLINE</span>
        </div>
      </div>

      {/* 텍스트 영역 */}
      <h1 style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10, letterSpacing: "-0.5px", lineHeight: 1.3 }}>
        인터넷 연결이 끊겼어요
      </h1>
      <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.8, marginBottom: 32, maxWidth: 260, textAlign: "center" }}>
        맛있는 순간들이 기다리고 있어요 🍽️<br />
        네트워크를 확인하고 다시 접속해주세요
      </p>

      {/* 상태 카드 */}
      <div style={{ background: WARM, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "14px 22px", marginBottom: 28, display: "flex", alignItems: "center", gap: 12, minWidth: 200 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B", animation: "breathe 1.4s ease-in-out infinite" }} />
        </div>
        <div>
          <p style={{ fontSize: 12, color: MUTED, margin: 0, marginBottom: 2 }}>연결 상태</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: INK, margin: 0 }}>재연결 대기 중 {dotStr}</p>
        </div>
      </div>

      {/* 버튼 */}
      <button
        onClick={() => window.location.reload()}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
        style={{ padding: "14px 36px", background: btnHover ? ROSE_DK : ROSE, border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s, transform 0.15s", transform: btnHover ? "translateY(-1px)" : "translateY(0)", letterSpacing: "-0.2px" }}
      >
        다시 시도하기
      </button>

      {/* 하단 안내 */}
      <p style={{ marginTop: 20, fontSize: 12, color: BORDER, textAlign: "center" }}>
        온라인 복구 시 자동으로 연결됩니다
      </p>

      <style>{`
        @keyframes rippleOut {
          0%   { opacity: 0.6; transform: scale(0.95); }
          100% { opacity: 0;   transform: scale(1.15); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(0.75); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
