// src/app/providers.tsx
//
//  Fix:
//    ★ KakaoAdFit 제거 — AppShell 안으로 이동했으므로 여기서는 불필요
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { setupAuthListener } from "@/store/authStore";
import { useAuthStore }      from "@/store/authStore";
import { checkAnniversary }  from "@/lib/firebase/notifications";
import { useFCM }            from "@/hooks/useFCM";
import { FCMToast }          from "@/components/common/FCMToast";
import { PWAInstallBanner }  from "@/components/common/PWAInstallBanner";

const PUBLIC_PATHS = ["/onboarding", "/login", "/signup", "/couple"];

function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-bg notranslate" suppressHydrationWarning>
      <div className="mb-5 text-[40px]">🍽️</div>
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-rose-light border-t-rose" />
      <p className="mt-4 text-[13px] text-muted">우리의 맛지도</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
    }
  }, [mounted, initialized, myUid, pathname, router]);

  if (!mounted)      return <GlobalLoader />;
  if (!initialized)  return <GlobalLoader />;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return <>{children}</>;
  if (!myUid)   return <GlobalLoader />;

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
    <div className="pointer-events-none fixed bottom-[90px] left-1/2 z-999 whitespace-nowrap rounded-3xl bg-linear-to-br from-rose to-rose-pill px-[22px] py-3 text-[13px] font-bold text-white shadow-[0_4px_20px_rgba(201,107,82,0.4)] animate-[fadeUp_0.3s_ease_both] [-webkit-transform:translateX(-50%)] transform-[translateX(-50%)]">
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
