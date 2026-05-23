// src/app/(auth)/login/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter }                   from "next/navigation";
import { signIn, signInWithGoogle, handleGoogleRedirectResult } from "@/lib/firebase/auth";
import { fetchUser }                   from "@/lib/firebase/auth";
import { useAuthStore }                from "@/store/authStore";
import { validateEmail, validatePassword } from "@/lib/utils/validation";
import { sendPasswordResetEmail }      from "firebase/auth";
import { auth, db }                    from "@/lib/firebase/config";
import { doc, onSnapshot }             from "firebase/firestore";

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

// ── 비밀번호 찾기 인라인 폼
function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email,   setEmail]   = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [status,  setStatus]  = useState<"idle"|"loading"|"sent"|"error">("idle");
  const [errMsg,  setErrMsg]  = useState("");

  const handleSend = async () => {
    const err = validateEmail(email);
    if (err) { setEmailErr(err); return; }
    setEmailErr(""); setStatus("loading");
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
      setStatus("sent");
    } catch (e: any) {
      const code = e.code ?? "";
      if (code === "auth/user-not-found") {
        setStatus("sent");
      } else if (code === "auth/invalid-email") {
        setEmailErr("올바른 이메일 형식이 아닙니다.");
        setStatus("idle");
      } else if (code === "auth/too-many-requests") {
        setErrMsg("잠시 후 다시 시도해주세요.");
        setStatus("error");
      } else {
        setErrMsg("발송에 실패했습니다. 다시 시도해주세요.");
        setStatus("error");
      }
    }
  };

  if (status === "sent") {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:4 }}>📬</div>
        <p style={{ fontSize:17, fontWeight:800, color:INK }}>이메일을 확인해주세요</p>
        <p style={{ fontSize:13, color:MUTED, lineHeight:1.7 }}>
          <strong style={{ color:INK }}>{email}</strong>으로<br/>
          비밀번호 재설정 링크를 보냈어요.<br/>
          스팸함도 함께 확인해주세요.
        </p>
        <div style={{ background:"#F0FBF4", border:"1px solid #BBE5CA", borderRadius:12, padding:"12px 16px", textAlign:"left" }}>
          <p style={{ fontSize:12, color:"#2D6A4F", lineHeight:1.6 }}>
            💡 링크는 <strong>24시간</strong> 동안 유효해요.<br/>
            이메일이 도착하지 않으면 아래 버튼으로 다시 시도해주세요.
          </p>
        </div>
        <button onClick={onBack}
          style={{ width:"100%", padding:14, background:ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          로그인으로 돌아가기
        </button>
        <button onClick={()=>setStatus("idle")}
          style={{ background:"none", border:"none", color:MUTED, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
          다시 보내기
        </button>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <button onClick={onBack}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:MUTED, lineHeight:1, padding:"0 4px 0 0", marginBottom:8 }}>
          ‹
        </button>
        <p style={{ fontSize:18, fontWeight:800, color:INK, marginBottom:4 }}>비밀번호 재설정</p>
        <p style={{ fontSize:13, color:MUTED, lineHeight:1.6 }}>
          가입한 이메일을 입력하면 재설정 링크를 보내드려요.
        </p>
      </div>

      {/* 아이디(이메일) 찾기 안내 */}
      <div style={{ background:"#F5F0EB", borderRadius:12, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start" }}>
        <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
        <p style={{ fontSize:12, color:MUTED, lineHeight:1.6 }}>
          <strong style={{ color:INK }}>아이디를 잊으셨나요?</strong><br/>
          우리의 맛지도는 <strong style={{ color:INK }}>이메일이 곧 아이디</strong>예요.<br/>
          가입 시 사용한 이메일을 입력하거나,<br/>
          Google 계정으로 로그인해보세요.
        </p>
      </div>

      <div>
        <p style={{ fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>가입한 이메일</p>
        <input
          type="email"
          value={email}
          autoFocus
          onChange={e=>{ setEmail(e.target.value); setEmailErr(""); setErrMsg(""); }}
          onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); handleSend(); } }}
          placeholder="example@email.com"
          style={{ width:"100%", padding:"13px 14px", background:WARM, border:`1.5px solid ${emailErr?"#EF4444":BORDER}`, borderRadius:12, color:INK, fontSize:15, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
        />
        <FieldError msg={emailErr} />
      </div>

      {errMsg && (
        <div style={{ padding:"11px 14px", background:"#FFF0F0", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10 }}>
          <p style={{ fontSize:13, color:"#EF4444" }}>❌ {errMsg}</p>
        </div>
      )}

      <button onClick={handleSend} disabled={status==="loading"}
        style={{ width:"100%", padding:14, background:status==="loading"?"#C0B8B0":ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor:status==="loading"?"default":"pointer", fontFamily:"inherit" }}>
        {status==="loading" ? "발송 중…" : "재설정 링크 보내기"}
      </button>
    </div>
  );
}

export default function LoginPage() {
  const router  = useRouter();
  const pwRef   = useRef<HTMLInputElement>(null);
  const { myUid } = useAuthStore();

  const [mode,         setMode]         = useState<"login"|"forgot">("login");
  const [email,        setEmail]        = useState("");
  const [pw,           setPw]           = useState("");
  const [showPw,       setShowPw]       = useState(false);
  const [remember,     setRemember]     = useState(false);
  const [errors,       setErrors]       = useState({ email:"", pw:"" });
  const [apiErr,       setApiErr]       = useState("");
  const [loading,      setLoading]      = useState(false);
  const [supportEmail, setSupportEmail] = useState("");

  // 저장된 이메일 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { setEmail(saved); setRemember(true); }
  }, []);

  // Firestore config/app 에서 고객센터 이메일 불러오기
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "app"), (snap) => {
      if (snap.exists()) setSupportEmail(snap.data().supportEmail ?? "");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoading(true);
    handleGoogleRedirectResult()
      .then(async (user) => {
        if (!user) return;
        try {
          const userDoc = await fetchUser(user.uid);
          if (!userDoc?.coupleId) {
            router.push("/couple");
          }
        } catch {
          // fetchUser 실패 시 AuthGuard에 위임
        }
      })
      .catch((e: any) => {
        const code = e.code ?? "";
        if (code === "auth/account-exists-with-different-credential") {
          setApiErr("이미 이메일로 가입된 계정입니다. 이메일 로그인을 사용해주세요.");
        } else if (code === "auth/unauthorized-domain") {
          setApiErr("이 도메인에서 Google 로그인이 허용되지 않습니다.");
        } else if (code) {
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
      setTimeout(() => setLoading(false), 5000);
    } catch (e: any) {
      const msg = e.code ?? e.message ?? "";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setApiErr("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (msg.includes("too-many-requests")) {
        setApiErr("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setApiErr("로그인에 실패했습니다. 다시 시도해주세요.");
      }
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setApiErr(""); setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      console.error("[Google Auth] 오류:", e.code, e.message);
      setApiErr(`Google 로그인을 시작할 수 없습니다. (${e.code ?? e.message})`);
      setLoading(false);
    }
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); pwRef.current?.focus(); }
  };
  const handlePwKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleLogin(); }
  };

  if (mode === "forgot") {
    return <ForgotPasswordForm onBack={()=>setMode("login")} />;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <p style={{ fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>이메일</p>
        <input type="email" value={email}
          onChange={e=>{ setEmail(e.target.value); setErrors(p=>({...p,email:""})); }}
          onKeyDown={handleEmailKeyDown}
          placeholder="example@email.com"
          style={inp(!!errors.email)} />
        <FieldError msg={errors.email} />
      </div>

      <div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
          <p style={{ fontSize:12, fontWeight:600, color:MUTED }}>비밀번호</p>
          <button onClick={()=>{ setApiErr(""); setMode("forgot"); }}
            style={{ background:"none", border:"none", color:ROSE, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", padding:0 }}>
            비밀번호를 잊으셨나요?
          </button>
        </div>
        <div style={{ position:"relative" }}>
          <input ref={pwRef} type={showPw?"text":"password"} value={pw}
            onChange={e=>{ setPw(e.target.value); setErrors(p=>({...p,pw:""})); }}
            onKeyDown={handlePwKeyDown}
            placeholder="비밀번호 입력"
            style={{ ...inp(!!errors.pw), paddingRight:44 }} />
          <button onClick={()=>setShowPw(s=>!s)}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:MUTED }}>
            {showPw?"🙈":"👁️"}
          </button>
        </div>
        <FieldError msg={errors.pw} />
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div onClick={()=>setRemember(r=>!r)}
          style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${remember?ROSE:BORDER}`, background:remember?ROSE:"#fff", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
          {remember && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span onClick={()=>setRemember(r=>!r)}
          style={{ fontSize:13, color:MUTED, cursor:"pointer", userSelect:"none" }}>
          아이디 저장
        </span>
      </div>

      {apiErr && (
        <div style={{ padding:"11px 14px", background:"#FFF0F0", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10 }}>
          <p style={{ fontSize:13, color:"#EF4444" }}>❌ {apiErr}</p>
        </div>
      )}

      <button onClick={handleLogin} disabled={loading}
        style={{ width:"100%", padding:14, background:loading?"#C0B8B0":ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor:loading?"default":"pointer", fontFamily:"inherit" }}>
        {loading?"로그인 중…":"로그인"}
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0" }}>
        <div style={{ flex:1, height:1, background:BORDER }} />
        <span style={{ fontSize:12, color:MUTED }}>또는</span>
        <div style={{ flex:1, height:1, background:BORDER }} />
      </div>

      <button onClick={handleGoogle} disabled={loading}
        style={{ width:"100%", padding:13, background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:12, color:INK, fontSize:14, fontWeight:600, cursor:loading?"default":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:loading?0.7:1 }}>
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

      {/* ─── 하단 약관 + 고객센터 ─── */}
      <div style={{ marginTop:8, paddingTop:16, borderTop:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
        {/* 약관 링크 */}
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:4, flexWrap:"wrap" }}>
          <button onClick={()=>router.push("/settings/privacy")}
            style={{ background:"none", border:"none", color:MUTED, fontSize:11, cursor:"pointer", fontFamily:"inherit", padding:"2px 4px" }}>
            개인정보 처리방침
          </button>
          <span style={{ color:BORDER, fontSize:11 }}>|</span>
          <button onClick={()=>router.push("/settings/terms")}
            style={{ background:"none", border:"none", color:MUTED, fontSize:11, cursor:"pointer", fontFamily:"inherit", padding:"2px 4px" }}>
            서비스 이용약관
          </button>
        </div>
        {/* 고객센터 이메일 */}
        {supportEmail ? (
          <p style={{ fontSize:11, color:MUTED, textAlign:"center" }}>
            문제가 있으신가요?{" "}
            <a href={`mailto:${supportEmail}`}
              style={{ color:ROSE, fontWeight:600, textDecoration:"none" }}>
              {supportEmail}
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
