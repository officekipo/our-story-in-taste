// src/app/(auth)/layout.tsx
// 로그인 / 회원가입 / 커플 연동 페이지 공통 레이아웃

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      {/* 앱 로고 */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#D4956A", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>OUR STORY IN TASTE</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1412" }}>우리의 맛지도</h1>
        <p style={{ fontSize: 13, color: "#8A8078", marginTop: 4 }}>함께한 모든 순간을 기억해요</p>
      </div>
      {/* 흰 카드 */}
      <div style={{ width: "100%", maxWidth: 360, background: "#fff", borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 28 }}>
        {children}
      </div>
    </div>
  );
}
