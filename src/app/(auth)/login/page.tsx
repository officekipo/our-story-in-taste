// ============================================================
//  login/page.tsx  적용 경로: src/app/(auth)/login/page.tsx
//  정규식 유효성 검사 추가
// ============================================================
"use client";

import { useState }  from "react";
import { useRouter } from "next/navigation";
import { signIn, signInWithGoogle } from "@/lib/firebase/auth";
import { validateEmail, validatePassword }   from "@/lib/utils/validation";

const ROSE  = "#C96B52";
const INK   = "#1A1412";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";
const WARM  = "#FAF7F3";

function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p style={{ fontSize:11, color:"#EF4444", marginTop:4 }}>{msg}</p>;
}

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [pw,       setPw]       = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState({ email:"", pw:"" });
  const [apiErr,   setApiErr]   = useState("");
  const [loading,  setLoading]  = useState(false);

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

  const handleGoogle = async () => {
    setApiErr(""); setLoading(true);
    try { await signInWithGoogle(); router.push("/"); }
    catch { setApiErr("Google 로그인에 실패했습니다."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <p style={{ fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>이메일</p>
        <input type="email" value={email} onChange={e=>{ setEmail(e.target.value); setErrors(p=>({...p,email:""})); }}
          placeholder="example@email.com" style={inp(!!errors.email)} />
        <FieldError msg={errors.email} />
      </div>

      <div>
        <p style={{ fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>비밀번호</p>
        <div style={{ position:"relative" }}>
          <input type={showPw?"text":"password"} value={pw} onChange={e=>{ setPw(e.target.value); setErrors(p=>({...p,pw:""})); }}
            placeholder="비밀번호 입력" style={{ ...inp(!!errors.pw), paddingRight:44 }} />
          <button onClick={()=>setShowPw(s=>!s)}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:MUTED }}>
            {showPw?"🙈":"👁️"}
          </button>
        </div>
        <FieldError msg={errors.pw} />
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
        style={{ width:"100%", padding:13, background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:12, color:INK, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.4 1.2 8.7 3.2l6.5-6.5C35.2 2.7 30 .5 24 .5 14.8.5 7 6.2 3.5 14.1l7.6 5.9C13 14.2 18.1 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/><path fill="#FBBC05" d="M11.1 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.6-5.9A23.5 23.5 0 0 0 .5 24c0 3.8.9 7.4 2.5 10.6l8.1-6z"/><path fill="#34A853" d="M24 47.5c6 0 11.1-2 14.8-5.4l-7.5-5.8c-2 1.4-4.6 2.2-7.3 2.2-5.9 0-10.9-4-12.7-9.3l-8 6.2C7.1 42 15 47.5 24 47.5z"/></svg>
        Google 로 로그인
      </button>

      <p style={{ textAlign:"center", fontSize:13, color:MUTED }}>
        계정이 없으신가요?{" "}
        <button onClick={()=>router.push("/signup")} style={{ background:"none", border:"none", color:ROSE, fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>회원가입</button>
      </p>
    </div>
  );
}
