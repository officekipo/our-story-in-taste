// src/app/(auth)/login/page.tsx
"use client";

import { useState }     from "react";
import { useRouter }    from "next/navigation";
import { signIn }       from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/authStore";
import { fetchUser, fetchCouple } from "@/lib/firebase/auth";

const ROSE   = "#C96B52";
const ROSE_LT= "#F2D5CC";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

export default function LoginPage() {
  const router = useRouter();
  const { setMyUid, setMyName, setCoupleId, setPartnerName, setStartDate, setRole, setInitialized } = useAuthStore();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const inp: React.CSSProperties = {
    width: "100%", padding: "13px 14px",
    background: WARM, border: `1.5px solid ${BORDER}`, borderRadius: 12,
    color: INK, fontSize: 14, fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", marginBottom: 12, transition: "border-color 0.2s",
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fbUser = await signIn(email, password);
      const user   = await fetchUser(fbUser.uid);
      if (!user) throw new Error("유저 정보를 찾을 수 없습니다.");

      setMyUid(user.uid);
      setMyName(user.name);
      setCoupleId(user.coupleId);
      setRole(user.role ?? "user");
      setInitialized(true);

      if (user.coupleId) {
        const couple = await fetchCouple(user.coupleId);
        if (couple) {
          setStartDate(couple.startDate);
          const partnerUid = couple.user1Uid === fbUser.uid ? couple.user2Uid : couple.user1Uid;
          if (partnerUid) {
            const partner = await fetchUser(partnerUid);
            if (partner) setPartnerName(partner.name);
          }
        }
        router.push("/");
      } else {
        router.push("/couple");
      }
    } catch (err: any) {
      const code = err.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
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

  return (
    <form onSubmit={handleLogin}>
      {/* 헤더 */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 4 }}>다시 만나서 반가워요!</h2>
        <p style={{ fontSize: 13, color: MUTED }}>우리의 맛지도에 로그인하세요</p>
      </div>

      <input type="email"    placeholder="이메일"   value={email}    onChange={(e) => setEmail(e.target.value)}    style={inp} required />
      <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} style={inp} required />

      {error && (
        <div style={{ background: "#FFF0F0", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 12, marginTop: -4 }}>
          <p style={{ fontSize: 12, color: "#EF4444" }}>⚠️ {error}</p>
        </div>
      )}

      <button
        type="submit" disabled={loading}
        style={{ width: "100%", padding: "14px", background: loading ? "#C0B8B0" : ROSE, border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 4px 16px rgba(201,107,82,0.3)", transition: "all 0.2s" }}
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <div style={{ flex: 1, height: 1, background: BORDER }} />
        <span style={{ fontSize: 12, color: MUTED }}>또는</span>
        <div style={{ flex: 1, height: 1, background: BORDER }} />
      </div>

      <button
        type="button"
        onClick={() => router.push("/signup")}
        style={{ width: "100%", padding: "14px", background: "#fff", border: `1.5px solid ${BORDER}`, borderRadius: 14, color: INK, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
      >
        처음이에요 — 회원가입
      </button>
    </form>
  );
}
