// src/app/(auth)/login/page.tsx
//
//  Fix:
//    ★ Google 로그인 — 리다이렉트 방식 대응
//      - handleGoogle: signInWithGoogle() 호출 (페이지가 Google로 이동)
//      - useEffect: 페이지 로드 시 handleGoogleRedirectResult() 로 결과 수신
//        결과가 있으면 → 로그인 성공 → "/" 로 이동
//        에러가 있으면 → 에러 코드별 메시지 표시
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter }                   from "next/navigation";
import { signIn, signInWithGoogle, handleGoogleRedirectResult } from "@/lib/firebase/auth";
import { validateEmail, validatePassword } from "@/lib/utils/validation";

const ROSE  = "#C96B52";
const INK   = "#1A1412";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";
const WARM  = "#FAF7F3";

const STORAGE_KEY = "ourtaste_saved_email";

function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p style={{ fontSize:11, color:"#EF4444", marginTop:4 }}>{msg}</p>;
}

export default function LoginPage() {
  const router = useRouter();
  const pwRef  = useRef<HTMLInputElement>(null);

  const [email,    setEmail]    = useState("");
  const [pw,       setPw]       = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors,   setErrors]   = useState({ email:"", pw:"" });
  const [apiErr,   setApiErr]   = useState("");
  const [loading,  setLoading]  = useState(false);

  // 저장된 이메일 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { setEmail(saved); setRemember(true); }
  }, []);

  // ★ Google 리다이렉트 결과 수신
  //   Google 인증 후 이 페이지로 돌아왔을 때 결과 처리
  useEffect(() => {
    setLoading(true);
    handleGoogleRedirectResult()
      .then((user) => {
        if (user) {
          // 리다이렉트 로그인 성공 → 홈으로 이동
          router.push("/");
        }
      })
      .catch((e: any) => {
        const code = e.code ?? "";

        if (code === "auth/account-exists-with-different-credential") {
          setApiErr("이미 이메일로 가입된 계정입니다. 이메일 로그인을 사용해주세요.");
          return;
        }
        if (code === "auth/unauthorized-domain") {
          setApiErr("이 도메인에서 Google 로그인이 허용되지 않았습니다. 관리자에게 문의해주세요.");
          return;
        }
        // 그 외 오류
        if (code) {
          setApiErr(`Google 로그인에 실패했습니다. (${code})`);
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const inp = (hasErr: boolean): React.CSSProperties => ({
    width:"100%", padding:"13px 14px", background:WARM,
    border:`1.5px solid ${hasErr?"#EF4444":BORDER}`,
    borderRadius:12, color:INK, fontSize:15,
    fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  });

  const validate = () => {
    const e = { email: validateEmail(email), pw: validatePassword(pw) };
    setErrors(e);
    return !e.email && !e.pw;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setApiErr(""); setLoading(true);
    try {
      if (remember) { localStorage.setItem(STORAGE_KEY, email); }
      else          { localStorage.removeItem(STORAGE_KEY); }
      await signIn(email, pw);
      router.push("/");
    } catch (e: any) {
      const msg = e.code ?? e.message ?? "";
      if (msg.includes("user-not-found")||msg.includes("wrong-password")||msg.includes("invalid-credential")) {
        setApiErr("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (msg.includes("too-many-requests")) {
        setApiErr("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setApiErr("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally { setLoading(false); }
  };

  // ★ Google 로그인 — 리다이렉트 방식
  //   이 함수 호출 시 즉시 Google 인증 페이지로 이동
  //   결과는 위 useEffect의 handleGoogleRedirectResult()에서 수신
  const handleGoogle = async () => {
    setApiErr(""); setLoading(true);
    try {
      await signInWithGoogle(); // 페이지가 Google로 이동 → 이후 코드 실행 안 됨
    } catch (e: any) {
      console.error("[Google Auth] 리다이렉트 실패:", e.code, e.message);
      setApiErr(`Google 로그인을 시작할 수 없습니다. (${e.code ?? e.message})`);
      setLoading(false);
    }
    // ★ signInWithRedirect는 페이지를 이동시키므로 finally는 의미 없음
    //   setLoading(false) 생략 — 페이지 이동 중에는 로딩 상태 유지가 자연스러움
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); pwRef.current?.focus(); }
  };
  const handlePwKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleLogin(); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* 이메일 */}
      <div>
        <p style={{ fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>이메일</p>
        <input
          type="email" value={email}
          onChange={e=>{ setEmail(e.target.value); setErrors(p=>({...p,email:""})); }}
          onKeyDown={handleEmailKeyDown}
          placeholder="example@email.com"
          style={inp(!!errors.email)}
        />
        <FieldError msg={errors.email} />
      </div>

      {/* 비밀번호 */}
      <div>
        <p style={{ fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>비밀번호</p>
        <div style={{ position:"relative" }}>
          <input
            ref={pwRef}
            type={showPw?"text":"password"} value={pw}
            onChange={e=>{ setPw(e.target.value); setErrors(p=>({...p,pw:""})); }}
            onKeyDown={handlePwKeyDown}
            placeholder="비밀번호 입력"
            style={{ ...inp(!!errors.pw), paddingRight:44 }}
          />
          <button onClick={()=>setShowPw(s=>!s)}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:MUTED }}>
            {showPw?"🙈":"👁️"}
          </button>
        </div>
        <FieldError msg={errors.pw} />
      </div>

      {/* 아이디 저장 */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div
          onClick={()=>setRemember(r=>!r)}
          style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${remember?ROSE:BORDER}`, background:remember?ROSE:"#fff", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
          {remember && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span
          onClick={()=>setRemember(r=>!r)}
          style={{ fontSize:13, color:MUTED, cursor:"pointer", userSelect:"none" }}>
          아이디 저장
        </span>
      </div>

      {/* API 오류 */}
      {apiErr && (
        <div style={{ padding:"11px 14px", background:"#FFF0F0", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10 }}>
          <p style={{ fontSize:13, color:"#EF4444" }}>❌ {apiErr}</p>
        </div>
      )}

      {/* 로그인 버튼 */}
      <button onClick={handleLogin} disabled={loading}
        style={{ width:"100%", padding:14, background:loading?"#C0B8B0":ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor:loading?"default":"pointer", fontFamily:"inherit" }}>
        {loading?"로그인 중…":"로그인"}
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0" }}>
        <div style={{ flex:1, height:1, background:BORDER }} />
        <span style={{ fontSize:12, color:MUTED }}>또는</span>
        <div style={{ flex:1, height:1, background:BORDER }} />
      </div>

      {/* Google 로그인 */}
      <button onClick={handleGoogle} disabled={loading}
        style={{ width:"100%", padding:13, background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:12, color:INK, fontSize:14, fontWeight:600, cursor:loading?"default":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity: loading ? 0.7 : 1 }}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.4 1.2 8.7 3.2l6.5-6.5C35.2 2.7 30 .5 24 .5 14.8.5 7 6.2 3.5 14.1l7.6 5.9C13 14.2 18.1 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
          <path fill="#FBBC05" d="M11.1 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.6-5.9A23.5 23.5 0 0 0 .5 24c0 3.8.9 7.4 2.5 10.6l8.1-6z"/>
          <path fill="#34A853" d="M24 47.5c6 0 11.1-2 14.8-5.4l-7.5-5.8c-2 1.4-4.6 2.2-7.3 2.2-5.9 0-10.9-4-12.7-9.3l-8 6.2C7.1 42 15 47.5 24 47.5z"/>
        </svg>
        {loading ? "로그인 중…" : "Google 로 로그인"}
      </button>

      <p style={{ textAlign:"center", fontSize:13, color:MUTED }}>
        계정이 없으신가요?{" "}
        <button onClick={()=>router.push("/signup")} style={{ background:"none", border:"none", color:ROSE, fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>회원가입</button>
      </p>
    </div>
  );
}
