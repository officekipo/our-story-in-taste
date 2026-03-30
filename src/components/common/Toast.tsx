// src/components/common/Toast.tsx
"use client";

import { useEffect } from "react";

interface ToastProps {
  message:   string;
  onClose:   () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 2200 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "rgba(26,20,18,0.9)", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 900, whiteSpace: "nowrap", pointerEvents: "none", animation: "fadeUp 0.3s ease both" }}>
      {message}
    </div>
  );
}
