"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { setupAuthListener } from "@/store/authStore";
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
      }),
  );
  useEffect(() => {
    /* 앱 시작 시 Firebase Auth 상태 감지 리스너 등록
반환값(unsubscribe)을 cleanup 함수에서 호출해 리스너 해제 */
    let unsubscribe: (() => void) | undefined;
    setupAuthListener().then((unsub) => {
      unsubscribe = unsub;
    });
    return () => {
      unsubscribe?.();
    };
  }, []);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
