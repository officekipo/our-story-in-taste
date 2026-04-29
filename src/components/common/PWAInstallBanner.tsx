// src/components/common/PWAInstallBanner.tsx
//
//  Fix:
//    ★ localStorage try/catch — 광고차단기/프라이버시 모드에서 차단 시 오류 방지
//    ★ Edge beforeinstallprompt 중복 발화 방지 — ref로 처리 여부 관리
//    ★ 이미 dismissed 체크 강화
"use client";

import { useEffect, useState, useRef } from "react";

const ROSE        = "#C96B52";
const INK         = "#1A1412";
const MUTED       = "#8A8078";
const DISMISS_KEY  = "pwa_banner_dismissed_until";
const DISMISS_DAYS = 7;

type Platform = "ios" | "android" | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ★ localStorage 안전 접근 헬퍼
const safeStorage = {
  get: (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set: (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch { /* 무시 */ }
  },
};

export function PWAInstallBanner() {
  const [platform, setPlatform]   = useState<Platform>(null);
  const [visible,  setVisible]    = useState(false);
  const [step,     setStep]       = useState<"banner" | "guide">("banner");
  const deferredPrompt            = useRef<BeforeInstallPromptEvent | null>(null);
  const promptHandled             = useRef(false); // ★ 중복 발화 방지

  useEffect(() => {
    // ── 이미 설치된 상태
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // ── 최근 닫은 경우
    const dismissedUntil = safeStorage.get(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    const ua = navigator.userAgent;

    // ── iOS Safari 감지
    const isIOS    = /iPhone|iPad|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
    if (isIOS && isSafari) {
      setPlatform("ios");
      setTimeout(() => setVisible(true), 1500);
      return;
    }

    // ── Android/Desktop Chrome — beforeinstallprompt
    const handler = (e: Event) => {
      if (promptHandled.current) return; // ★ 중복 방지
      promptHandled.current = true;
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setPlatform("android");
      setTimeout(() => setVisible(true), 1500);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    safeStorage.set(DISMISS_KEY, String(until));
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") setVisible(false);
    deferredPrompt.current = null;
  };

  if (!visible || !platform) return null;

  return (
    <>
      {platform === "ios" && step === "guide" && (
        <div onClick={() => setStep("banner")}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9990, backdropFilter: "blur(2px)" }} />
      )}

      {/* 메인 배너 */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9991,
        background: "#fff", borderTop: "1px solid #E2DDD8",
        borderRadius: "20px 20px 0 0", padding: "16px 20px 32px",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
        animation: "pwaSlideUp 0.35s cubic-bezier(0.32,0.72,0,1) both",
      }}>
        <style>{`@keyframes pwaSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div style={{ width: 36, height: 4, background: "#E2DDD8", borderRadius: 2, margin: "0 auto 16px" }} />

        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, background: ROSE, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(201,107,82,0.35)" }}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <rect x="9.5"  y="8.5" width="2" height="6.5" rx="1" fill="white"/>
              <rect x="13"   y="8.5" width="2" height="6.5" rx="1" fill="white"/>
              <rect x="16.5" y="8.5" width="2" height="6.5" rx="1" fill="white"/>
              <rect x="9.5"  y="15" width="9" height="1.8" rx="0.9" fill="white"/>
              <rect x="13"   y="16.5" width="2" height="14" rx="1" fill="white"/>
              <path d="M27.5 20.5C27.5 20.5 22 16.5 22 13.2C22 11.3 23.6 10 25.4 10C26.5 10 27.5 10.9 27.5 10.9C27.5 10.9 28.5 10 29.6 10C31.4 10 33 11.3 33 13.2C33 16.5 27.5 20.5 27.5 20.5Z" fill="white"/>
              <circle cx="27.5" cy="29" r="2.5" fill="rgba(255,255,255,0.75)"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: INK, marginBottom: 3 }}>우리의 맛지도</p>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
              {platform === "ios"
                ? "홈 화면에 추가하면 앱처럼 사용할 수 있어요 🍽️"
                : "홈 화면에 설치하면 더 편하게 사용할 수 있어요 🍽️"}
            </p>
          </div>
          <button onClick={dismiss}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#C0B8B0", padding: 4, flexShrink: 0, lineHeight: 1 }}
            aria-label="닫기">×</button>
        </div>

        {platform === "ios" && (
          <button onClick={() => setStep("guide")}
            style={{ width: "100%", marginTop: 16, padding: "13px 0", background: ROSE, border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v13M7 7l5-5 5 5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 14v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            설치 방법 보기
          </button>
        )}

        {platform === "android" && (
          <button onClick={handleAndroidInstall}
            style={{ width: "100%", marginTop: 16, padding: "13px 0", background: ROSE, border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 16l-4-4h3V4h2v8h3l-4 4z" fill="#fff"/>
              <path d="M4 18h16v2H4v-2z" fill="#fff"/>
            </svg>
            홈 화면에 설치하기
          </button>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "#C0B8B0", marginTop: 10 }}>
          설치해도 데이터는 그대로 유지돼요
        </p>
      </div>

      {/* iOS 상세 가이드 */}
      {platform === "ios" && step === "guide" && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9992,
          background: "#fff", borderRadius: "20px 20px 0 0",
          padding: "20px 24px 40px",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.2)",
          animation: "pwaSlideUp 0.3s ease both",
        }}>
          <div style={{ width: 36, height: 4, background: "#E2DDD8", borderRadius: 2, margin: "0 auto 20px" }} />
          <p style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 4 }}>홈 화면에 추가하기</p>
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 24, lineHeight: 1.5 }}>Safari에서 아래 순서를 따라주세요</p>

          {[
            { step: "1", title: "공유 버튼 탭", desc: "Safari 하단 가운데 □↑ 버튼을 탭해요" },
            { step: "2", title: "홈 화면에 추가 선택", desc: "스크롤해서 '홈 화면에 추가'를 탭해요" },
            { step: "3", title: "추가 버튼 탭", desc: "우측 상단 '추가'를 탭하면 완료!" },
          ].map(item => (
            <div key={item.step} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FFF5F2", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: ROSE }}>
                {item.step}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 2 }}>{item.title}</p>
                <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}

          <button onClick={dismiss}
            style={{ width: "100%", padding: "13px 0", marginTop: 4, background: "#F5F0EB", border: "none", borderRadius: 14, color: MUTED, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            닫기
          </button>
        </div>
      )}
    </>
  );
}
