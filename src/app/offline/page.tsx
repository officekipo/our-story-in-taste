// src/app/offline/page.tsx
//
//  네트워크 오프라인 시 표시되는 커스텀 페이지
//  next-pwa가 오프라인 시 자동으로 이 경로로 fallback
"use client";

import { useEffect, useState } from "react";

const ROSE  = "#C96B52";
const INK   = "#1A1412";
const MUTED = "#8A8078";

export default function OfflinePage() {
  const [dots, setDots] = useState(".");

  // 연결 재시도 애니메이션
  useEffect(() => {
    const t = setInterval(() => {
      setDots(d => d.length >= 3 ? "." : d + ".");
    }, 600);
    return () => clearInterval(t);
  }, []);

  // 온라인 복구 시 자동 새로고침
  useEffect(() => {
    const handleOnline = () => window.location.reload();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: "100dvh", padding: "0 32px",
      background: "#FAF7F3", textAlign: "center",
      fontFamily: '"Pretendard", -apple-system, sans-serif',
    }}>
      {/* 로고 심볼 */}
      <div style={{ marginBottom: 32 }}>
        <svg width="72" height="72" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="11" fill="#C96B52" opacity="0.15"/>
          <rect x="9.5"  y="8.5" width="2" height="6.5" rx="1" fill="#C96B52"/>
          <rect x="13"   y="8.5" width="2" height="6.5" rx="1" fill="#C96B52"/>
          <rect x="16.5" y="8.5" width="2" height="6.5" rx="1" fill="#C96B52"/>
          <rect x="9.5"  y="15"  width="9" height="1.8" rx="0.9" fill="#C96B52"/>
          <rect x="13"   y="16.5" width="2" height="14" rx="1" fill="#C96B52"/>
          <path d="M27.5 20.5C27.5 20.5 22 16.5 22 13.2C22 11.3 23.6 10 25.4 10C26.5 10 27.5 10.9 27.5 10.9C27.5 10.9 28.5 10 29.6 10C31.4 10 33 11.3 33 13.2C33 16.5 27.5 20.5 27.5 20.5Z" fill="#C96B52"/>
        </svg>
      </div>

      {/* 오프라인 아이콘 */}
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "#F2D5CC",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, marginBottom: 24,
      }}>
        📡
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 10 }}>
        인터넷 연결을 확인해주세요
      </h1>

      <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: 32, maxWidth: 280 }}>
        우리의 맛지도가 연결을 기다리고 있어요.<br />
        네트워크 상태를 확인하고 다시 시도해주세요 🍽️
      </p>

      {/* 재연결 대기 표시 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 20px", background: "#fff",
        borderRadius: 20, border: "1px solid #E2DDD8",
        marginBottom: 24,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#F59E0B",
          animation: "pulse 1.2s ease-in-out infinite",
        }} />
        <span style={{ fontSize: 13, color: MUTED }}>
          재연결 대기 중{dots}
        </span>
      </div>

      {/* 수동 새로고침 버튼 */}
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: "13px 32px",
          background: ROSE, border: "none",
          borderRadius: 12, color: "#fff",
          fontSize: 15, fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 4px 16px rgba(201,107,82,0.35)",
        }}
      >
        다시 시도
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
