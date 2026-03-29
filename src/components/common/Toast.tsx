"use client";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number; // ms, 기본 2200
}
export function Toast({ message, onClose, duration = 2200 }: ToastProps) {
  /* duration 후 자동으로 닫기 */
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  return (
    <div
        className="
            fixed bottom-20 left-1/2 -translate-x-1/2
            bg-ink/90 text-white
            px-5 py-2.5 rounded-full
            text-sm font-semibold whitespace-nowrap
            animate-fade-up pointer-events-none
            z-[900]
        "
    >
      {message}
    </div>
  );
}
/* ── 사용 예시 ── */
// const [toast, setToast] = useState<string | null>(null);
//
// <button onClick={() => setToast('저장했어요!')}>저장</button>
// {toast && <Toast message={toast} onClose={() => setToast(null)} />}
