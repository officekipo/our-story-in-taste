// src/components/layout/SideDrawer.tsx
"use client";

import { useRouter }    from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { calcDDay }     from "@/lib/utils/date";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const SAGE    = "#6B9E7E";
const PURPLE  = "#7B6BAE";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const CREAM   = "#F0EBE3";

interface SideDrawerProps {
  open:    boolean;
  onClose: () => void;
}

export function SideDrawer({ open, onClose }: SideDrawerProps) {
  const router = useRouter();
  const { myName, partnerName, startDate, role } = useAuthStore();
  const dday = calcDDay(startDate || "2023-01-01");

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const menuItems = [
    { icon: "⚙️", label: "설정",               path: "/settings" },
    { icon: "👤", label: "내 프로필",           path: "/settings" },
    { icon: "💑", label: "커플 연동 / 초대 코드", path: "/settings" },
    { icon: "🔔", label: "알림 설정",           path: "/settings" },
  ];

  const infoItems = [
    { icon: "📄", label: "개인정보 처리방침",        path: "/settings/privacy" },
    { icon: "📋", label: "서비스 이용약관",          path: "/settings/terms" },
    { icon: "📍", label: "위치기반 서비스 이용약관", path: "/settings/location-terms" },
    { icon: "💬", label: "고객센터 / 문의하기",      path: "/settings/support" },
  ];

  return (
    <>
      {/* dim 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 400,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s",
        }}
      />

      {/* 드로어 패널 */}
      <div
        style={{
          position:      "fixed",
          top:           0,
          right:         0,
          bottom:        0,
          width:         "72%",
          maxWidth:      300,
          background:    "#fff",
          zIndex:        401,
          transform:     open ? "translateX(0)" : "translateX(100%)",
          transition:    "transform 0.28s cubic-bezier(0.32,1,0.4,1)",
          overflowY:     "auto",
          boxShadow:     "-4px 0 24px rgba(0,0,0,0.12)",
          display:       "flex",
          flexDirection: "column",
        }}
      >
        {/* 상단 프로필 영역 */}
        <div style={{ background: `linear-gradient(135deg, ${ROSE_LT}, ${CREAM})`, padding: "52px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* 아바타 */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: ROSE, border: "2.5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800 }}>
                {(myName || "?")[0]}
              </div>
              <div style={{ position: "absolute", bottom: -2, right: -6, width: 22, height: 22, borderRadius: "50%", background: SAGE, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 8, fontWeight: 800 }}>
                {(partnerName || "?")[0]}
              </div>
            </div>

            {/* 이름 + 배지 */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: INK }}>{myName || "로딩 중"}</p>
                {role === "admin" && (
                  <div style={{ background: PURPLE, borderRadius: 20, padding: "1px 7px" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>관리자</span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 12, color: MUTED }}>{myName} ❤️ {partnerName}</p>
              <div style={{ display: "inline-flex", alignItems: "center", background: ROSE_LT, borderRadius: 20, padding: "2px 8px", marginTop: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: ROSE, lineHeight: 1 }}>💑 D+{dday}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 메뉴 목록 */}
        <div style={{ flex: 1, padding: "8px 0" }}>

          {/* 설정 메뉴 */}
          <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase", padding: "12px 20px 6px" }}>설정</p>
          {menuItems.map(({ icon, label, path }) => (
            <button key={label} onClick={() => go(path)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "none", border: "none", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{icon}</span>
              <span style={{ fontSize: 14, color: INK, fontWeight: 500 }}>{label}</span>
              <span style={{ marginLeft: "auto", fontSize: 16, color: "#C0B8B0" }}>›</span>
            </button>
          ))}

          {/* 관리자 메뉴 */}
          {role === "admin" && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase", padding: "16px 20px 6px" }}>관리자</p>
              <button onClick={() => go("/admin")}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: WARM, border: "none", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>🛡️</span>
                <span style={{ fontSize: 14, color: PURPLE, fontWeight: 600 }}>관리자 페이지</span>
                <div style={{ marginLeft: "auto", background: ROSE_LT, borderRadius: 20, padding: "1px 7px" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: ROSE }}>ADMIN</span>
                </div>
              </button>
            </>
          )}

          {/* 앱 정보 */}
          <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase", padding: "16px 20px 6px" }}>앱 정보</p>
          {infoItems.map(({ icon, label, path }) => (
            <button key={label} onClick={() => go(path)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "none", border: "none", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{icon}</span>
              <span style={{ fontSize: 14, color: INK, fontWeight: 500 }}>{label}</span>
              <span style={{ marginLeft: "auto", fontSize: 16, color: "#C0B8B0" }}>›</span>
            </button>
          ))}
        </div>

        {/* 하단 버전 */}
        <div style={{ padding: "16px 20px 32px", textAlign: "center", borderTop: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 11, color: MUTED }}>우리의 맛지도 v1.0.0</p>
          <p style={{ fontSize: 10, color: "#C0B8B0", marginTop: 2 }}>Our Taste Inc.</p>
        </div>
      </div>
    </>
  );
}
