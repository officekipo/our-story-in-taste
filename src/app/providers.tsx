// src/app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect }              from "react";
import { setupAuthListener }                from "@/store/authStore";
import { checkAnniversary }                 from "@/lib/firebase/notifications";
import { useAuthStore }                     from "@/store/authStore";

// ── 기념일 알림 토스트 ──────────────────────────────────
function AnniversaryToast() {
  const { startDate } = useAuthStore();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!startDate) return;
    const anniv = checkAnniversary(startDate);
    if (anniv) {
      setMsg(anniv);
      const t = setTimeout(() => setMsg(null), 5000);
      return () => clearTimeout(t);
    }
  }, [startDate]);

  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%",
      transform: "translateX(-50%)",
      background: "linear-gradient(135deg, #C96B52, #E8897A)",
      color: "#fff", padding: "12px 20px",
      borderRadius: 24, fontSize: 13, fontWeight: 600,
      zIndex: 999, whiteSpace: "nowrap",
      boxShadow: "0 4px 20px rgba(201,107,82,0.4)",
      animation: "fadeUp 0.3s ease both",
      pointerEvents: "none",
    }}>
      🎉 {msg}
    </div>
  );
}

// ── 메인 Providers ──────────────────────────────────────
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
    })
  );

  useEffect(() => {
    // Firebase Auth 상태 감지 리스너 등록
    // Firebase 연동 전: authStore 샘플값 사용
    // Firebase 연동 후: authStore.ts의 setupAuthListener 주석 해제
    let unsubscribe: (() => void) | undefined;
    setupAuthListener().then((unsub) => { unsubscribe = unsub; });
    return () => { unsubscribe?.(); };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <AnniversaryToast />
    </QueryClientProvider>
  );
}
