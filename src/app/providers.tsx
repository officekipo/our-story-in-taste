// src/app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { setupAuthListener } from "@/store/authStore";
import { useAuthStore } from "@/store/authStore";
import { checkAnniversary } from "@/lib/firebase/notifications";

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = ["/onboarding", "/login", "/signup", "/couple"];

// ── 전체 화면 로딩 스피너 ──────────────────────────────
function GlobalLoader() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#F5F0EB",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 20 }}>🍽️</div>
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid #F2D5CC",
          borderTopColor: "#C96B52",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ marginTop: 16, fontSize: 13, color: "#8A8078" }}>
        우리의 맛지도
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── 인증 가드: 로그인 안 된 유저 → /login 으로 ─────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { initialized, myUid } = useAuthStore();

  // Firebase 초기화 완료 전 → 로딩
  if (!initialized) return <GlobalLoader />;

  // 공개 경로는 통과
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return <>{children}</>;

  // 로그인 안 됨 → /login 으로
  if (!myUid) {
    router.replace("/login");
    return <GlobalLoader />;
  }

  return <>{children}</>;
}

// ── 기념일 토스트 ──────────────────────────────────────
function AnniversaryToast() {
  const { startDate } = useAuthStore();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!startDate) return;
    const anniv = checkAnniversary(startDate);
    if (anniv) {
      // 앱 시작 후 2초 뒤 표시 (화면 로딩 후 보이도록)
      const t = setTimeout(() => {
        setMsg(anniv);
        setTimeout(() => setMsg(null), 5000);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [startDate]);

  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 90,
        left: "50%",
        transform: "translateX(-50%)",
        background: "linear-gradient(135deg, #C96B52, #E8897A)",
        color: "#fff",
        padding: "12px 22px",
        borderRadius: 24,
        fontSize: 13,
        fontWeight: 700,
        zIndex: 999,
        whiteSpace: "nowrap",
        boxShadow: "0 4px 20px rgba(201,107,82,0.4)",
        animation: "fadeUp 0.3s ease both",
        pointerEvents: "none",
      }}
    >
      🎉 {msg}
    </div>
  );
}

// ── 메인 Providers ──────────────────────────────────────
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
      }),
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    setupAuthListener().then((unsub) => {
      unsubscribe = unsub;
    });
    return () => {
      unsubscribe?.();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>{children}</AuthGuard>
      <AnniversaryToast />
    </QueryClientProvider>
  );
}
