// src/app/(auth)/layout.tsx
// 로그인 / 회원가입 / 커플 연동 공통 레이아웃
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const ROSE = "#C96B52";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const { initialized, myUid } = useAuthStore();

  // ★ store 초기화 완료 후, 로그인 안 된 유저만 이 레이아웃 사용
  // couple 페이지는 로그인된 유저도 접근 가능해야 하므로 리디렉션 없음
  // 단, 초기화 전까지는 로딩 표시
  useEffect(() => {
    // 미로그인 유저가 /couple 외 auth 페이지 접근 시에만 처리
    // (로그인 페이지는 미로그인이 정상)
  }, [initialized, myUid, router]);

  // ★ store 초기화 전 — 깜빡임 방지 로딩
  if (!initialized) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#FDF1ED 0%,#F5F0EB 50%)" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:32, height:32, border:`3px solid #F2D5CC`, borderTopColor:ROSE, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          <p style={{ fontSize:13, color:"#C96B52", fontWeight:600 }}>불러오는 중…</p>
        </div>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: 480,
        margin: "0 auto",
        background: "linear-gradient(160deg, #FDF1ED 0%, #F5F0EB 50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      {/* 앱 로고 */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#D4956A", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>
          OUR STORY IN TASTE
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1A1412", letterSpacing: -0.5 }}>
          우리의 맛지도
        </h1>
      </div>

      {/* 흰 카드 */}
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 4px 24px rgba(201,107,82,0.1)",
          padding: "28px 28px 32px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
