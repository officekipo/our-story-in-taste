// src/app/(auth)/login/page.tsx
"use client";

import { useState }  from "react";
import { useRouter } from "next/navigation";
import { signIn }    from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/authStore";
import { fetchUser, fetchCouple } from "@/lib/firebase/auth";

const ROSE   = "#C96B52";
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

  const inp: React.CSSProperties = { width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fbUser = await signIn(email, password);

      // Firestore에서 유저 정보 로드
      const user = await fetchUser(fbUser.uid);
      if (!user) throw new Error("유저 정보를 찾을 수 없습니다.");

      // authStore에 flat하게 저장 (변수명 기준 준수)
      setMyUid(user.uid);
      setMyName(user.name);
      setCoupleId(user.coupleId);
      setRole(user.role ?? "user");
      setInitialized(true);

      // 커플 정보 로드
      if (user.coupleId) {
        const couple = await fetchCouple(user.coupleId);
        if (couple) {
          setStartDate(couple.startDate);
          // 파트너 uid로 파트너 이름 불러오기
          const partnerUid = couple.user1Uid === fbUser.uid ? couple.user2Uid : couple.user1Uid;
          if (partnerUid) {
            const partner = await fetchUser(partnerUid);
            if (partner) setPartnerName(partner.name);
          }
        }
        router.push("/");
      } else {
        router.push("/couple"); // 커플 미연동 상태면 연동 페이지로
      }
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (err.code === "auth/invalid-email") {
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
      <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, marginBottom: 24 }}>로그인</h2>
      <input type="email"    placeholder="이메일"    value={email}    onChange={e => setEmail(e.target.value)}    style={inp} required />
      <input type="password" placeholder="비밀번호"  value={password} onChange={e => setPassword(e.target.value)} style={inp} required />
      {error && <p style={{ fontSize: 12, color: "#EF4444", marginBottom: 12, marginTop: -4 }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: loading ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
        {loading ? "로그인 중..." : "로그인"}
      </button>
      <p style={{ textAlign: "center", fontSize: 13, color: MUTED, marginTop: 16 }}>
        계정이 없으신가요? <a href="/signup" style={{ color: ROSE, fontWeight: 600, textDecoration: "none" }}>회원가입</a>
      </p>
    </form>
  );
}
