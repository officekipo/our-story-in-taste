// src/app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useRef }      from "react";
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

  "/settings/privacy",
  "/settings/terms",
  "/settings/location-terms",
];

// startDate가 "미설정" 상태로 간주되는 값들
const isStartDateUnset = (d: string | null | undefined) =>
  !d || d.trim() === "";

// ── 프로필 초기 설정 팝업 ──────────────────────────────────
function ProfileSetupPopup({ onComplete }: { onComplete: () => void }) {
  const { myUid, myName, setAuth } = useAuthStore();

  const [name, setName]     = useState(myName || "");
  const [date, setDate]     = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const handleSave = async () => {
    if (!name.trim()) {
      setError("닉네임을 입력해주세요.");
      nameRef.current?.focus();
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { doc, updateDoc, getFirestore } = await import("firebase/firestore");
      const { getApp } = await import("firebase/app");
      const db = getFirestore(getApp());
      const finalDate = date.trim() || today;

      // ★ profileCompleted: true 를 함께 저장
      //   → Firestore users 문서에 플래그 기록
      //   → authStore onSnapshot이 자동으로 profileCompleted: true 로 업데이트
      //   → PWA 재실행·기기 교체에도 팝업 재노출 없음
      await updateDoc(doc(db, "users", myUid), {
        name:             name.trim(),
        startDate:        finalDate,
        profileCompleted: true,
      });

      // ★ store 즉시 반영 (onSnapshot 도착 전 UI 즉시 닫기)
      setAuth({ myName: name.trim(), startDate: finalDate, profileCompleted: true });

      onComplete();
    } catch (e) {
      console.error(e);
      setError("저장 중 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 8888,
        background: "rgba(26,20,18,0.52)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <style>{`
        @keyframes profileSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes profileFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          width: "100%", maxWidth: 480,
          background: "#FAF7F3",
          borderRadius: "24px 24px 0 0",
          padding: "0 0 env(safe-area-inset-bottom, 0px)",
          animation: "profileSlideUp 0.32s cubic-bezier(0.32,1,0.4,1) both",
          overflow: "hidden",
        }}
      >
        {/* 상단 핸들 */}
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E2DDD8" }} />
        </div>

        <div style={{ padding: "20px 24px 36px" }}>
          {/* 아이콘 + 타이틀 */}
          <div
            style={{
              textAlign: "center", marginBottom: 28,
              animation: "profileFadeIn 0.4s ease 0.15s both",
            }}
          >
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "linear-gradient(135deg, #F2D5CC 0%, #C96B52 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
              fontSize: 28,
              boxShadow: "0 4px 16px rgba(201,107,82,0.25)",
            }}>🍴</div>
            <p style={{
              fontSize: 18, fontWeight: 800, color: "#1A1412",
              margin: "0 0 8px",
              fontFamily: "Pretendard, -apple-system, sans-serif",
              letterSpacing: "-0.02em",
            }}>프로필을 완성해요</p>
            <p style={{
              fontSize: 13, color: "#8A8078",
              margin: 0, lineHeight: 1.65,
              fontFamily: "Pretendard, -apple-system, sans-serif",
            }}>
              닉네임과 교제 시작일을 설정하면<br />더 즐거운 맛지도가 시작돼요 🗺️
            </p>
          </div>

          {/* 닉네임 */}
          <div
            style={{
              marginBottom: 14,
              animation: "profileFadeIn 0.4s ease 0.25s both",
            }}
          >
            <label style={{
              display: "block",
              fontSize: 12, fontWeight: 700, color: "#8A8078",
              marginBottom: 7, letterSpacing: "0.05em",
              fontFamily: "Pretendard, -apple-system, sans-serif",
            }}>
              닉네임 <span style={{ color: "#C96B52" }}>*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
              maxLength={20}
              placeholder="나의 닉네임"
              style={{
                width: "100%", padding: "13px 16px",
                border: "1.5px solid #E2DDD8",
                borderRadius: 12, background: "#fff",
                fontSize: 15, color: "#1A1412",
                fontFamily: "Pretendard, -apple-system, sans-serif",
                boxSizing: "border-box",
                outline: "none",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "#C96B52"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#E2DDD8"; }}
            />
            {myName && (
              <p style={{
                fontSize: 11, color: "#C0B8B0", marginTop: 5,
                fontFamily: "Pretendard, -apple-system, sans-serif",
              }}>
                구글 계정 이름이 자동 입력됐어요. 원하시면 수정하세요.
              </p>
            )}
          </div>

          {/* 교제 시작일 */}
          <div
            style={{
              marginBottom: 24,
              animation: "profileFadeIn 0.4s ease 0.32s both",
            }}
          >
            <label style={{
              display: "block",
              fontSize: 12, fontWeight: 700, color: "#8A8078",
              marginBottom: 7, letterSpacing: "0.05em",
              fontFamily: "Pretendard, -apple-system, sans-serif",
            }}>
              교제 시작일
              <span style={{
                fontWeight: 400, color: "#C0B8B0", marginLeft: 6, fontSize: 11,
              }}>미입력 시 오늘 날짜 · 이후 설정에서 변경 가능</span>
            </label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
              style={{
                width: "100%", padding: "13px 16px",
                border: "1.5px solid #E2DDD8",
                borderRadius: 12, background: "#fff",
                fontSize: 15, color: date ? "#1A1412" : "#C0B8B0",
                fontFamily: "Pretendard, -apple-system, sans-serif",
                boxSizing: "border-box",
                outline: "none",
                WebkitAppearance: "none",
                appearance: "none",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "#C96B52"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#E2DDD8"; }}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p style={{
              fontSize: 12, color: "#C96B52",
              marginBottom: 12, textAlign: "center",
              fontFamily: "Pretendard, -apple-system, sans-serif",
              animation: "profileFadeIn 0.2s ease both",
            }}>
              {error}
            </p>
          )}

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%", padding: "15px 0",
              background: saving
                ? "#E2DDD8"
                : "linear-gradient(135deg, #C96B52 0%, #B85D45 100%)",
              border: "none", borderRadius: 14,
              color: saving ? "#8A8078" : "#fff",
              fontSize: 16, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "Pretendard, -apple-system, sans-serif",
              letterSpacing: "-0.01em",
              boxShadow: saving ? "none" : "0 4px 16px rgba(201,107,82,0.3)",
              animation: "profileFadeIn 0.4s ease 0.38s both",
            }}
          >
            {saving ? "저장 중..." : "완료 🎉"}
          </button>
        </div>
      </div>
    </div>
  );
}

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

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        <div style={{
          animation: "splashScale 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
          marginBottom: 20,
        }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="36" r="36" fill="#C96B52" fillOpacity="0.12" />
            <circle cx="36" cy="36" r="26" fill="#C96B52" fillOpacity="0.18" />
            <path d="M36 48 C36 48 22 38.5 22 29.5 C22 24.8 25.8 21 30.5 21 C33 21 35.2 22.2 36 24 C36.8 22.2 39 21 41.5 21 C46.2 21 50 24.8 50 29.5 C50 38.5 36 48 36 48Z" fill="#C96B52" />
            <rect x="26" y="23" width="1.5" height="8" rx="0.75" fill="#FAF7F3" opacity="0.7" />
            <rect x="28.5" y="23" width="1.5" height="8" rx="0.75" fill="#FAF7F3" opacity="0.7" />
            <rect x="26.5" y="30" width="3" height="5" rx="1.5" fill="#FAF7F3" opacity="0.7" />
          </svg>
        </div>

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

        <p style={{
          animation: "splashFadeUp 0.6s ease 0.7s both",
          fontSize: 12, color: "#8A8078", letterSpacing: "0.04em",
          fontFamily: "Pretendard, -apple-system, sans-serif",
          marginTop: 4,
        }}>함께한 모든 순간을 기억해요</p>

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
  const { initialized, myUid, emailVerified, myName, startDate, profileCompleted } = useAuthStore();

  const [mounted, setMounted]                   = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  // ★ Firestore 데이터 도착 대기 플래그
  //   myUid 세팅 후 myName/startDate가 실제로 채워질 때까지 대기
  //   사양 낮은 기기에서 팝업이 잠깐 보였다 사라지는 현상 방지
  const [profileReady, setProfileReady]         = useState(false);
  const profileReadyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // ★ myUid 확정 후 Firestore 데이터 도착 대기
  useEffect(() => {
    if (!myUid) { setProfileReady(false); return; }
    // 이미 데이터가 있으면 즉시 ready
    if (myName && myName.trim() !== "") { setProfileReady(true); return; }
    // 없으면 800ms 대기 후 ready (Firestore 응답 대기)
    profileReadyTimer.current = setTimeout(() => setProfileReady(true), 800);
    return () => { if (profileReadyTimer.current) clearTimeout(profileReadyTimer.current); };
  }, [myUid, myName]);

  // ★ 프로필 팝업 표시 여부 결정
  useEffect(() => {
    if (!mounted || !initialized || !myUid || !emailVerified || !profileReady) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (isPublic) return;

    // ★ Firestore profileCompleted: true 이면 팝업 억제
    //   - PWA 재실행, 기기 교체, 브라우저 캐시 삭제에도 유지됨
    //   - authStore가 users 문서를 실시간 구독하므로 별도 읽기 없음
    if (profileCompleted) {
      setShowProfilePopup(false);
      return;
    }

    const needsName      = !myName || myName.trim() === "";
    const needsStartDate = isStartDateUnset(startDate);

    if (needsName || needsStartDate) {
      setShowProfilePopup(true);
    } else {
      // 닉네임·시작일이 이미 채워진 기존 유저
      // → Firestore에 profileCompleted: true 선제 저장 (다음 재실행부터 팝업 없음)
      import("firebase/firestore").then(({ doc: fsDoc, updateDoc, getFirestore }) => {
        import("firebase/app").then(({ getApp }) => {
          updateDoc(fsDoc(getFirestore(getApp()), "users", myUid), {
            profileCompleted: true,
          }).catch(() => {});
        });
      });
      setShowProfilePopup(false);
    }
  }, [mounted, initialized, myUid, emailVerified, profileReady, profileCompleted, myName, startDate, pathname]);

  useEffect(() => {
    if (!mounted || !initialized) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (!isPublic && !myUid) {
      router.replace("/login");
      return;
    }

    const isLegalPage = ["/settings/privacy", "/settings/terms", "/settings/location-terms"]
      .some((p) => pathname.startsWith(p));

    if (isPublic && !isLegalPage && myUid && emailVerified) {
      router.replace("/");
    }
  }, [mounted, initialized, myUid, emailVerified, pathname, router]);

  if (!mounted)     return <SplashScreen />;
  if (!initialized) return <SplashScreen />;

  const isPublic    = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isLegalPage = ["/settings/privacy", "/settings/terms", "/settings/location-terms"]
    .some((p) => pathname.startsWith(p));

  if (isLegalPage) return <>{children}</>;
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
      {showProfilePopup && (
        <ProfileSetupPopup onComplete={() => setShowProfilePopup(false)} />
      )}
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
    if (isStartDateUnset(startDate)) return;
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

    import("@/lib/firebase/auth").then(({ handleGoogleRedirectResult }) => {
      handleGoogleRedirectResult().catch((e: unknown) => {
        console.error("[Google Redirect 처리 실패]", e);
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>{children}</AuthGuard>
      <AnniversaryToast />
    </QueryClientProvider>
  );
}
