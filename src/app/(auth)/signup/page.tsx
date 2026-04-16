// ============================================================
//  signup/page.tsx  적용 경로: src/app/(auth)/signup/page.tsx
//  정규식 유효성 검사 추가
// ============================================================
"use client";

import { useState }  from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/firebase/auth";
import { validateEmail, validatePassword, validatePasswordConfirm, validateNickname } from "@/lib/utils/validation";

const ROSE  = "#C96B52";
const INK   = "#1A1412";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";
const WARM  = "#FAF7F3";

function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p style={{ fontSize:11, color:"#EF4444", marginTop:4 }}>{msg}</p>;
}

// 비밀번호 강도 계산
function pwStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)                      score++;
  if (/[A-Z]/.test(pw))                   score++;
  if (/[0-9]/.test(pw))                   score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) score++;
  const labels = ["", "약함", "보통", "강함", "매우 강함"];
  const colors = ["", "#EF4444", "#F59E0B", "#6B9E7E", "#059669"];
  return { score, label: labels[score] ?? "", color: colors[score] ?? "" };
}

export default function SignupPage() {
  const router = useRouter();
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [pwc,     setPwc]     = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [errors,  setErrors]  = useState({ name:"", email:"", pw:"", pwc:"" });
  const [apiErr,  setApiErr]  = useState("");
  const [loading, setLoading] = useState(false);

  const inp = (hasErr: boolean): React.CSSProperties => ({
    width:"100%", padding:"13px 14px", background:WARM,
    border:`1.5px solid ${hasErr?"#EF4444":BORDER}`,
    borderRadius:12, color:INK, fontSize:15,
    fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  });

  const strength = pwStrength(pw);

  const validate = () => {
    const e = {
      name:  validateNickname(name),
      email: validateEmail(email),
      pw:    validatePassword(pw),
      pwc:   validatePasswordConfirm(pw, pwc),
    };
    setErrors(e);
    return !e.name && !e.email && !e.pw && !e.pwc;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setApiErr(""); setLoading(true);
    try {
      await signUp(email, pw, name.trim());
      router.push("/couple");
    } catch (e: any) {
      const msg = e.code ?? e.message ?? "";
      if (msg.includes("email-already-in-use")) setApiErr("이미 사용 중인 이메일입니다.");
      else if (msg.includes("weak-password"))   setApiErr("비밀번호가 너무 약합니다.");
      else setApiErr("회원가입에 실패했습니다. 다시 시도해주세요.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* 닉네임 */}
      <div>
        <p style={{ fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>닉네임</p>
        <input value={name} onChange={e=>{ setName(e.target.value); setErrors(p=>({...p,name:""})); }}
          placeholder="2~10자 (한글/영문/숫자)" maxLength={10} style={inp(!!errors.name)} />
        <FieldError msg={errors.name} />
        {!errors.name && name && <p style={{ fontSize:11, color:MUTED, marginTop:4 }}>앱 내에서 사용할 이름이에요</p>}
      </div>

      {/* 이메일 */}
      <div>
        <p style={{ fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>이메일</p>
        <input type="email" value={email} onChange={e=>{ setEmail(e.target.value); setErrors(p=>({...p,email:""})); }}
          placeholder="example@email.com" style={inp(!!errors.email)} />
        <FieldError msg={errors.email} />
      </div>

      {/* 비밀번호 */}
      <div>
        <p style={{ fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>비밀번호</p>
        <div style={{ position:"relative" }}>
          <input type={showPw?"text":"password"} value={pw} onChange={e=>{ setPw(e.target.value); setErrors(p=>({...p,pw:""})); }}
            placeholder="8~20자, 영문+숫자+특수문자" style={{ ...inp(!!errors.pw), paddingRight:44 }} />
          <button onClick={()=>setShowPw(s=>!s)}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:MUTED }}>
            {showPw?"🙈":"👁️"}
          </button>
        </div>
        {/* 강도 바 */}
        {pw && !errors.pw && (
          <div style={{ marginTop:6 }}>
            <div style={{ display:"flex", gap:4, marginBottom:3 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=strength.score?strength.color:"#E2DDD8", transition:"background 0.2s" }} />
              ))}
            </div>
            <p style={{ fontSize:11, color:strength.color }}>{strength.label}</p>
          </div>
        )}
        <FieldError msg={errors.pw} />
      </div>

      {/* 비밀번호 확인 */}
      <div>
        <p style={{ fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>비밀번호 확인</p>
        <input type="password" value={pwc} onChange={e=>{ setPwc(e.target.value); setErrors(p=>({...p,pwc:""})); }}
          placeholder="비밀번호 재입력" style={inp(!!errors.pwc)} />
        {!errors.pwc && pwc && pw===pwc && <p style={{ fontSize:11, color:"#6B9E7E", marginTop:4 }}>✅ 비밀번호가 일치합니다.</p>}
        <FieldError msg={errors.pwc} />
      </div>

      {apiErr && (
        <div style={{ padding:"11px 14px", background:"#FFF0F0", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10 }}>
          <p style={{ fontSize:13, color:"#EF4444" }}>❌ {apiErr}</p>
        </div>
      )}

      <button onClick={handleSignup} disabled={loading}
        style={{ width:"100%", padding:14, background:loading?"#C0B8B0":ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor:loading?"default":"pointer", fontFamily:"inherit" }}>
        {loading?"가입 중…":"시작하기 🍽️"}
      </button>

      <p style={{ textAlign:"center", fontSize:13, color:MUTED }}>
        이미 계정이 있으신가요?{" "}
        <button onClick={()=>router.push("/login")} style={{ background:"none", border:"none", color:ROSE, fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>로그인</button>
      </p>
    </div>
  );
}
