// src/app/providers.tsx
//
//  수정사항:
//    ★ GlobalLoader → SplashScreen 교체 (감성적 랜딩)
//    ★ setupAuthListener 반환값 변경 대응 (동기 방식)
//    ★ 이미 로그인된 상태에서 /login 등 PUBLIC_PATHS 접근 시 "/" 로 리다이렉트
//    ★ 약관/개인정보 페이지 로그인 없이 접근 가능하도록 PUBLIC_PATHS 추가
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect }              from "react";
import { useRouter, usePathname }           from "next/navigation";
import { setupAuthListener }               from "@/store/authStore";
import { useAuthStore }                    from "@/store/authStore";
import { checkAnniversary }                from "@/lib/firebase/notifications";
import { useFCM }                          from "@/hooks/useFCM";
import { FCMToast }                        from "@/components/common/FCMToast";
import { PWAInstallBanner }                from "@/components/common/PWAInstallBanner";

const PUBLIC_PATHS = [
  "/onboarding",
  "/login",
  "/signup",
  "/couple",
  // 약관 · 개인정보 — 로그인 없이 접근 가능 (Google Play 심사 요건)
  "/settings/privacy",
  "/settings/terms",
  "/settings/location-terms",
];

// ─────────────────────────────────────────────
//  감성적 스플래시 스크린
// ─────────────────────────────────────────────
function SplashScreen() {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"),  1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      suppressHydrationWarning
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #FAF7F3 0%, #F0E8DF 55%, #EAD9CE 100%)",
        opacity: phase === "out" ? 0 : 1,
        transition: phase === "out" ? "opacity 0.45s ease" : "none",
        pointerEvents: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <style>{`
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashScale {
          0%   { transform: scale(0.72); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes splashPulse {
          0%, 100% { transform: scale(1);    opacity: 0.55; }
          50%       { transform: scale(1.18); opacity: 0.85; }
        }
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40%            { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* 배경 원형 오브 */}
      <div style={{
        position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)",
        width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,107,82,0.13) 0%, rgba(201,107,82,0) 70%)",
        animation: "splashPulse 2.8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "22%", right: "12%",
        width: 120, height: 120, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(107,158,126,0.1) 0%, rgba(107,158,126,0) 70%)",
        animation: "splashPulse 3.4s ease-in-out infinite 0.6s",
      }} />

      {/* 메인 콘텐츠 */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

        {/* 로고 심볼 */}
        <div style={{
          animation: "splashScale 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
          marginBottom: 20,
        }}>
          {/* 포크+하트 심볼 SVG */}
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="36" r="36" fill="#C96B52" fillOpacity="0.12" />
            <circle cx="36" cy="36" r="26" fill="#C96B52" fillOpacity="0.18" />
            {/* 하트 */}
            <path d="M36 48 C36 48 22 38.5 22 29.5 C22 24.8 25.8 21 30.5 21 C33 21 35.2 22.2 36 24 C36.8 22.2 39 21 41.5 21 C46.2 21 50 24.8 50 29.5 C50 38.5 36 48 36 48Z" fill="#C96B52" />
            {/* 포크 (왼쪽 작은) */}
            <rect x="26" y="23" width="1.5" height="8" rx="0.75" fill="#FAF7F3" opacity="0.7" />
            <rect x="28.5" y="23" width="1.5" height="8" rx="0.75" fill="#FAF7F3" opacity="0.7" />
            <rect x="26.5" y="30" width="3" height="5" rx="1.5" fill="#FAF7F3" opacity="0.7" />
          </svg>
        </div>

        {/* 앱 이름 */}
        <div style={{
          animation: "splashFadeUp 0.6s ease 0.45s both",
          textAlign: "center",
          marginBottom: 8,
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.28em",
            color: "#C96B52", textTransform: "uppercase",
            marginBottom: 6, opacity: 0.8,
            fontFamily: "Pretendard, -apple-system, sans-serif",
          }}>OUR STORY IN TASTE</p>
          <h1 style={{
            fontSize: 26, fontWeight: 800, color: "#1A1412",
            letterSpacing: "-0.02em", lineHeight: 1,
            fontFamily: "Pretendard, -apple-system, sans-serif",
            margin: 0,
          }}>우리의 맛지도</h1>
        </div>

        {/* 슬로건 */}
        <p style={{
          animation: "splashFadeUp 0.6s ease 0.7s both",
          fontSize: 12, color: "#8A8078", letterSpacing: "0.04em",
          fontFamily: "Pretendard, -apple-system, sans-serif",
          marginTop: 4,
        }}>함께한 모든 순간을 기억해요</p>

        {/* 로딩 점 3개 */}
        <div style={{
          display: "flex", gap: 6, marginTop: 36,
          animation: "splashFadeUp 0.5s ease 0.9s both",
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#C96B52",
              animation: `splashDot 1.2s ease-in-out ${i * 0.18}s infinite`,
            }} />
          ))}
        </div>
      </div>

      {/* 하단 장식 */}
      <div style={{
        position: "absolute", bottom: 48,
        animation: "splashFadeUp 0.6s ease 1.1s both",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ width: 24, height: 1, background: "#C96B52", opacity: 0.3 }} />
        <span style={{ fontSize: 10, color: "#C96B52", opacity: 0.45, letterSpacing: "0.1em", fontFamily: "Pretendard, sans-serif" }}>OUR TASTE</span>
        <div style={{ width: 24, height: 1, background: "#C96B52", opacity: 0.3 }} />
      </div>
    </div>
  );
}

function FCMInitializer() {
  useFCM();
  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { initialized, myUid, emailVerified } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !initialized) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (!isPublic && !myUid) {
      router.replace("/login");
      return;
    }

    // 약관 페이지는 로그인 상태여도 리다이렉트하지 않음
    const isLegalPage = ["/settings/privacy", "/settings/terms", "/settings/location-terms"]
      .some((p) => pathname.startsWith(p));

    if (isPublic && !isLegalPage && myUid && emailVerified) {
      // ★ 이미 로그인+인증된 상태에서 /login, /signup 등 접근 → 홈으로
      router.replace("/");
    }
  }, [mounted, initialized, myUid, emailVerified, pathname, router]);

  if (!mounted)     return <SplashScreen />;
  if (!initialized) return <SplashScreen />;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isLegalPage = ["/settings/privacy", "/settings/terms", "/settings/location-terms"]
    .some((p) => pathname.startsWith(p));

  // 약관 페이지는 로그인 여부 무관하게 바로 렌더
  if (isLegalPage) return <>{children}</>;

  // ★ 로그인된 상태에서 PUBLIC 페이지 접근 시 로더 표시 (리다이렉트 대기)
  if (isPublic && myUid && emailVerified) return <SplashScreen />;

  if (isPublic) return <>{children}</>;
  if (!myUid)   return <SplashScreen />;

  if (!emailVerified) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 24px", gap: 16, background: "#FAF7F3" }}>
        <div style={{ fontSize: 48 }}>📧</div>
        <p style={{ fontSize: 17, fontWeight: 800, color: "#1A1412", textAlign: "center" }}>이메일 인증이 필요해요</p>
        <p style={{ fontSize: 13, color: "#8A8078", textAlign: "center", lineHeight: 1.7 }}>
          가입 시 보낸 인증 메일의 링크를 클릭한 후<br />아래 버튼을 눌러주세요.
        </p>
        <button
          onClick={async () => {
            await import("firebase/auth").then(({ getAuth }) => getAuth().currentUser?.reload());
            window.location.reload();
          }}
          style={{ width: "100%", maxWidth: 320, padding: 14, background: "#C96B52", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >✅ 인증 완료했어요</button>
        <button
          onClick={async () => {
            const { sendEmailVerification, getAuth } = await import("firebase/auth");
            const user = getAuth().currentUser;
            if (user) await sendEmailVerification(user);
            alert("인증 메일을 재발송했어요. 메일함을 확인해주세요.");
          }}
          style={{ background: "none", border: "none", color: "#8A8078", fontSize: 13, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}
        >📨 인증 메일 재발송</button>
        <button
          onClick={() => { import("firebase/auth").then(({ getAuth, signOut }) => signOut(getAuth())); }}
          style={{ background: "none", border: "none", color: "#C0B8B0", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
        >로그아웃</button>
      </div>
    );
  }

  return (
    <>
      {children}
      <FCMInitializer />
      <FCMToast />
      <PWAInstallBanner />
    </>
  );
}

function AnniversaryToast() {
  const { startDate } = useAuthStore();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!startDate) return;
    const anniv = checkAnniversary(startDate);
    if (anniv) {
      const t = setTimeout(() => {
        setMsg(anniv);
        setTimeout(() => setMsg(null), 5000);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [startDate]);

  if (!msg) return null;
  return (
    <div style={{ pointerEvents: "none", position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", zIndex: 999, whiteSpace: "nowrap", borderRadius: 999, background: "linear-gradient(135deg, #C96B52, #E8856B)", padding: "12px 22px", fontSize: 13, fontWeight: 700, color: "#fff", boxShadow: "0 4px 20px rgba(201,107,82,0.4)", animation: "fadeUp 0.3s ease both", fontFamily: "Pretendard, sans-serif" }}>
      🎉 {msg}
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
    }),
  );

  useEffect(() => {
    const unsubscribe = setupAuthListener();
    return () => unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>{children}</AuthGuard>
      <AnniversaryToast />
    </QueryClientProvider>
  );
}
