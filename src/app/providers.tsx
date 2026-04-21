// src/app/providers.tsx
//
// ★ Hydration #418 근본 해결
//
// 원인: SSR 단계에서 서버는 initialized=false → GlobalLoader 렌더링
//       클라이언트 hydration 단계에서 이미 다른 상태 → 불일치
//
// 해결: mounted 상태로 SSR/클라이언트 첫 렌더를 동일하게 맞춤
//   1. mounted=false 구간: 서버와 동일한 "빈 로더"를 렌더링
//   2. mounted=true 이후: 실제 auth 상태에 따라 렌더링
//   → SSR HTML === 클라이언트 첫 렌더 → hydration 성공
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { setupAuthListener } from "@/store/authStore";
import { useAuthStore } from "@/store/authStore";
import { checkAnniversary } from "@/lib/firebase/notifications";

const PUBLIC_PATHS = ["/onboarding", "/login", "/signup", "/couple"];

// ── 로딩 스피너 (SSR과 클라이언트 첫 렌더가 완전히 동일해야 함) ──
function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-bg">
      <div className="mb-5 text-[40px]">🍽️</div>
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-rose-light border-t-rose" />
      <p className="mt-4 text-[13px] text-muted">우리의 맛지도</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── 인증 가드 ─────────────────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { initialized, myUid } = useAuthStore();

  // ★ 핵심: mounted 전까지 GlobalLoader만 렌더
  //    → 서버 HTML(GlobalLoader)과 클라이언트 첫 렌더(GlobalLoader)가 일치
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // 리다이렉트는 항상 useEffect 안에서만
  useEffect(() => {
    if (!mounted || !initialized) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (!isPublic && !myUid) {
      router.replace("/login");
    }
  }, [mounted, initialized, myUid, pathname, router]);

  // SSR + 첫 hydration: GlobalLoader (서버 HTML과 동일)
  if (!mounted) return <GlobalLoader />;

  // Firebase 초기화 전
  if (!initialized) return <GlobalLoader />;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // 공개 경로
  if (isPublic) return <>{children}</>;

  // 비로그인 → 리다이렉트 대기 중
  if (!myUid) return <GlobalLoader />;

  return <>{children}</>;
}

// ── 기념일 토스트 ──────────────────────────────────────────
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
    <div className="pointer-events-none fixed bottom-[90px] left-1/2 z-999 whitespace-nowrap rounded-3xl bg-linear-to-br from-rose to-rose-pill px-[22px] py-3 text-[13px] font-bold text-white shadow-[0_4px_20px_rgba(201,107,82,0.4)] animate-[fadeUp_0.3s_ease_both] [-webkit-transform:translateX(-50%)] transform-[translateX(-50%)]">
      🎉 {msg}
    </div>
  );
}

// ── 메인 Providers ────────────────────────────────────────
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
    }),
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    setupAuthListener().then((unsub) => { unsubscribe = unsub; });
    return () => { unsubscribe?.(); };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>{children}</AuthGuard>
      <AnniversaryToast />
    </QueryClientProvider>
  );
}
