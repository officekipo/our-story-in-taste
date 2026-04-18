// src/app/providers.tsx
//
// Fix: GlobalLoader 내부 div/p 요소에 suppressHydrationWarning 추가
//   → Dark Reader 등 브라우저 확장이 내부 요소의 속성을 수정해도 hydration 오류 미발생
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { setupAuthListener } from "@/store/authStore";
import { useAuthStore } from "@/store/authStore";
import { checkAnniversary } from "@/lib/firebase/notifications";

const PUBLIC_PATHS = ["/onboarding", "/login", "/signup", "/couple"];

// ── 전체 화면 로딩 스피너 ──────────────────────────────
function GlobalLoader() {
  return (
    // ★ suppressHydrationWarning: Dark Reader가 하위 요소 속성을 수정해도 오류 안 남
    <div
      suppressHydrationWarning
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
      <div suppressHydrationWarning style={{ fontSize: 40, marginBottom: 20 }}>🍽️</div>
      <div
        suppressHydrationWarning
        style={{
          width: 32,
          height: 32,
          border: "3px solid #F2D5CC",
          borderTopColor: "#C96B52",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p suppressHydrationWarning style={{ marginTop: 16, fontSize: 13, color: "#8A8078" }}>
        우리의 맛지도
      </p>
      <style suppressHydrationWarning>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── 인증 가드 ─────────────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { initialized, myUid } = useAuthStore();

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!initialized) return;
    if (isPublic) return;
    if (!myUid) {
      router.replace("/login");
    }
  }, [initialized, myUid, isPublic, router]);

  if (!initialized) return <GlobalLoader />;
  if (isPublic) return <>{children}</>;
  if (!myUid) return <GlobalLoader />;

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
