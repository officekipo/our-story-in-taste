// src/app/(auth)/signup/page.tsx
"use client";

import { useState }  from "react";
import { useRouter } from "next/navigation";
import { signUp }    from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/authStore";

const ROSE   = "#C96B52";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

export default function SignupPage() {
  const router = useRouter();
  const { setMyUid, setMyName, setCoupleId, setInitialized } = useAuthStore();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const inp: React.CSSProperties = { width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim())          { setError("닉네임을 입력해주세요."); return; }
    if (password.length < 8)   { setError("비밀번호는 8자 이상이어야 합니다."); return; }
    if (password !== confirm)  { setError("비밀번호가 일치하지 않습니다."); return; }

    setLoading(true);
    try {
      const fbUser = await signUp(email, password, name.trim());
      // authStore 업데이트
      setMyUid(fbUser.uid);
      setMyName(name.trim());
      setCoupleId(null);
      setInitialized(true);
      router.push("/couple"); // 커플 연동 페이지로
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다.");
      } else if (err.code === "auth/invalid-email") {
        setError("올바른 이메일 형식을 입력해주세요.");
      } else {
        setError(err.message || "회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, marginBottom: 24 }}>회원가입</h2>
      <input placeholder="닉네임 (예: 치즈)"   value={name}     onChange={e => setName(e.target.value)}     style={inp} required />
      <input type="email" placeholder="이메일" value={email}    onChange={e => setEmail(e.target.value)}    style={inp} required />
      <input type="password" placeholder="비밀번호 (8자 이상)" value={password} onChange={e => setPassword(e.target.value)} style={inp} required />
      <input type="password" placeholder="비밀번호 확인"       value={confirm}  onChange={e => setConfirm(e.target.value)}  style={inp} required />
      {error && <p style={{ fontSize: 12, color: "#EF4444", marginBottom: 12, marginTop: -4 }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ width: "100%", padding: 13, background: loading ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
        {loading ? "가입 중..." : "가입하기"}
      </button>
      <p style={{ textAlign: "center", fontSize: 13, color: MUTED, marginTop: 16 }}>
        이미 계정이 있으신가요? <a href="/login" style={{ color: ROSE, fontWeight: 600, textDecoration: "none" }}>로그인</a>
      </p>
    </form>
  );
}
