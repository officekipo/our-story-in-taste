// src/app/(auth)/layout.tsx
// 로그인 / 회원가입 / 커플 연동 공통 레이아웃

export default function AuthLayout({ children }: { children: React.ReactNode }) {
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
