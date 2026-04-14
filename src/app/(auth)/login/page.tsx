// src/app/(auth)/login/page.tsx
"use client";

import { useState }     from "react";
import { useRouter }    from "next/navigation";
import {
  signIn,
  signInWithGoogle,
  fetchUser,
  fetchCouple,
} from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/authStore";

const ROSE   = "#C96B52";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

export default function LoginPage() {
  const router = useRouter();
  const {
    setMyUid, setMyName, setCoupleId,
    setPartnerName, setStartDate, setRole, setInitialized,
  } = useAuthStore();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const inp: React.CSSProperties = {
    width: "100%", padding: "13px 14px",
    background: WARM, border: `1.5px solid ${BORDER}`,
    borderRadius: 12, color: INK, fontSize: 14,
    fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", marginBottom: 12,
  };

  // 로그인 후 공통 처리
  const loadAndNavigate = async (uid: string) => {
    const user = await fetchUser(uid);
    if (!user) throw new Error("유저 정보를 불러올 수 없습니다.");

    setMyUid(user.uid);
    setMyName(user.name);
    setCoupleId(user.coupleId);
    setRole(user.role ?? "user");
    setInitialized(true);

    if (user.coupleId) {
      const couple = await fetchCouple(user.coupleId);
      if (couple) {
        setStartDate(couple.startDate);
        const partnerUid =
          couple.user1Uid === uid ? couple.user2Uid : couple.user1Uid;
        if (partnerUid) {
          const partner = await fetchUser(partnerUid);
          if (partner) setPartnerName(partner.name);
        }
      }
      router.push("/");
    } else {
      router.push("/couple");
    }
  };

  // 이메일 로그인
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fbUser = await signIn(email, password);
      await loadAndNavigate(fbUser.uid);
    } catch (err: any) {
      const code = err.code ?? "";
      if (["auth/user-not-found", "auth/wrong-password", "auth/invalid-credential"].includes(code)) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (code === "auth/invalid-email") {
        setError("올바른 이메일 형식을 입력해주세요.");
      } else {
        setError(err.message || "로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google 로그인
  const handleGoogle = async () => {
    setError("");
    setGLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      await loadAndNavigate(fbUser.uid);
    } catch (err: any) {
      // 팝업을 닫은 경우는 오류 표시 안 함
      if (err.code !== "auth/popup-closed-by-user" &&
          err.code !== "auth/cancelled-popup-request") {
        setError("Google 로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setGLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* 헤더 */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 4 }}>
          다시 만나서 반가워요!
        </h2>
        <p style={{ fontSize: 13, color: MUTED }}>우리의 맛지도에 로그인하세요</p>
      </div>

      <input type="email"    placeholder="이메일"   value={email}    onChange={e => setEmail(e.target.value)}    style={inp} required />
      <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} style={inp} required />

      {error && (
        <div style={{ background: "#FFF0F0", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 12, marginTop: -4 }}>
          <p style={{ fontSize: 12, color: "#EF4444" }}>⚠️ {error}</p>
        </div>
      )}

      {/* 이메일 로그인 버튼 */}
      <button type="submit" disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "#C0B8B0" : ROSE, border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 4px 16px rgba(201,107,82,0.3)", marginBottom: 14 }}>
        {loading ? "로그인 중..." : "로그인"}
      </button>

      {/* 구분선 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: BORDER }} />
        <span style={{ fontSize: 12, color: MUTED }}>또는</span>
        <div style={{ flex: 1, height: 1, background: BORDER }} />
      </div>

      {/* Google 로그인 버튼 */}
      <button type="button" onClick={handleGoogle} disabled={gLoading} style={{ width: "100%", padding: 14, background: "#fff", border: `1.5px solid ${BORDER}`, borderRadius: 14, color: INK, fontSize: 14, fontWeight: 600, cursor: gLoading ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        {gLoading ? "연결 중..." : "Google로 계속하기"}
      </button>

      {/* 회원가입 */}
      <button type="button" onClick={() => router.push("/signup")} style={{ width: "100%", padding: 14, background: WARM, border: `1.5px solid ${BORDER}`, borderRadius: 14, color: INK, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
        처음이에요 — 회원가입
      </button>
    </form>
  );
}
