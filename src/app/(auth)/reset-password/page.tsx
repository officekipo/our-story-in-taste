// src/app/(auth)/reset-password/page.tsx
//
//  흐름:
//    메일 링크 클릭
//    → /reset-password?oobCode=xxx&mode=resetPassword
//    → oobCode 유효성 확인 (verifyPasswordResetCode)
//    → 새 비밀번호 입력 (validatePassword로 규칙 강제)
//    → confirmPasswordReset(auth, oobCode, newPw)
//    → 완료 → /login 이동
"use client";

import { useState, useEffect }    from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth }                   from "@/lib/firebase/config";
import { validatePassword }       from "@/lib/utils/validation";
import { PASSWORD_REGEX }         from "@/lib/utils/validation";

const ROSE   = "#C96B52";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";
const RED    = "#EF4444";

type Phase = "verifying" | "ready" | "success" | "expired" | "error";

function ConditionRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <p style={{ fontSize:12, color:ok?"#2D6A4F":MUTED, marginTop:3, display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ fontSize:13 }}>{ok ? "✅" : "○"}</span>
      {label}
    </p>
  );
}

export default function ResetPasswordPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const oobCode      = searchParams.get("oobCode") ?? "";

  const [phase,     setPhase]     = useState<Phase>("verifying");
  const [email,     setEmail]     = useState("");   // verifyPasswordResetCode로 확인된 이메일
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [errors,    setErrors]    = useState({ newPw:"", confirmPw:"" });
  const [apiErr,    setApiErr]    = useState("");
  const [loading,   setLoading]   = useState(false);

  // oobCode 유효성 확인
  useEffect(() => {
    if (!oobCode) { setPhase("expired"); return; }
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => { setEmail(email); setPhase("ready"); })
      .catch(() => setPhase("expired"));
  }, [oobCode]);

  const validate = () => {
    const errs = { newPw:"", confirmPw:"" };
    const pwErr = validatePassword(newPw);
    if (pwErr) errs.newPw = pwErr;
    if (!confirmPw) {
      errs.confirmPw = "비밀번호 확인을 입력해주세요.";
    } else if (newPw !== confirmPw) {
      errs.confirmPw = "비밀번호가 일치하지 않습니다.";
    }
    setErrors(errs);
    return !errs.newPw && !errs.confirmPw;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setApiErr(""); setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPw);
      setPhase("success");
    } catch (e: any) {
      const code = e.code ?? "";
      if (code === "auth/expired-action-code" || code === "auth/invalid-action-code") {
        setPhase("expired");
      } else if (code === "auth/weak-password") {
        setErrors(prev => ({ ...prev, newPw:"비밀번호가 너무 약합니다. 조건을 다시 확인해주세요." }));
      } else {
        setApiErr("비밀번호 변경에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = (hasErr: boolean): React.CSSProperties => ({
    width:"100%", padding:"13px 48px 13px 14px", background:WARM,
    border:`1.5px solid ${hasErr?RED:BORDER}`,
    borderRadius:12, color:INK, fontSize:15,
    fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  });

  // ── 로딩 중 (oobCode 검증)
  if (phase === "verifying") {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:"40px 0", textAlign:"center" }}>
        <div style={{ width:40, height:40, borderRadius:"50%", border:`3px solid ${BORDER}`, borderTopColor:ROSE, animation:"spin 0.8s linear infinite" }} />
        <p style={{ fontSize:14, color:MUTED }}>링크를 확인하는 중이에요…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── 링크 만료 / 유효하지 않음
  if (phase === "expired") {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16, textAlign:"center" }}>
        <div style={{ fontSize:52 }}>⏰</div>
        <p style={{ fontSize:18, fontWeight:800, color:INK }}>링크가 만료됐어요</p>
        <p style={{ fontSize:13, color:MUTED, lineHeight:1.7 }}>
          비밀번호 재설정 링크는 <strong style={{ color:INK }}>24시간</strong> 동안만 유효해요.<br/>
          아래 버튼을 눌러 새 링크를 요청해주세요.
        </p>
        <button onClick={()=>router.push("/login")}
          style={{ width:"100%", padding:14, background:ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          로그인 페이지로 돌아가기
        </button>
      </div>
    );
  }

  // ── 변경 성공
  if (phase === "success") {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16, textAlign:"center" }}>
        <div style={{ fontSize:52 }}>🎉</div>
        <p style={{ fontSize:18, fontWeight:800, color:INK }}>비밀번호가 변경됐어요!</p>
        <p style={{ fontSize:13, color:MUTED, lineHeight:1.7 }}>
          새 비밀번호로 로그인해주세요.
        </p>
        <button onClick={()=>router.replace("/login")}
          style={{ width:"100%", padding:14, background:ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          로그인하러 가기
        </button>
      </div>
    );
  }

  // ── 비밀번호 입력 폼 (phase === "ready")
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* 헤더 */}
      <div>
        <p style={{ fontSize:18, fontWeight:800, color:INK, marginBottom:4 }}>새 비밀번호 설정</p>
        {email && (
          <p style={{ fontSize:13, color:MUTED }}>
            <strong style={{ color:INK }}>{email}</strong> 계정의 비밀번호를 변경해요.
          </p>
        )}
      </div>

      {/* 비밀번호 조건 안내 */}
      <div style={{ background:"#F5F0EB", borderRadius:12, padding:"12px 14px" }}>
        <p style={{ fontSize:12, fontWeight:700, color:INK, marginBottom:6 }}>🔐 비밀번호 조건</p>
        <ConditionRow ok={newPw.length >= 8 && newPw.length <= 20} label="8~20자" />
        <ConditionRow ok={/[a-zA-Z]/.test(newPw)} label="영문 포함" />
        <ConditionRow ok={/\d/.test(newPw)} label="숫자 포함" />
        <ConditionRow ok={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPw)} label="특수문자 포함 (!@#$% 등)" />
      </div>

      {/* 새 비밀번호 */}
      <div>
        <p style={{ fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>새 비밀번호</p>
        <div style={{ position:"relative" }}>
          <input
            type={showNew?"text":"password"}
            value={newPw}
            autoFocus
            onChange={e=>{ setNewPw(e.target.value); setErrors(p=>({...p,newPw:""})); setApiErr(""); }}
            placeholder="새 비밀번호 입력"
            style={inp(!!errors.newPw)}
          />
          <button onClick={()=>setShowNew(s=>!s)}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:MUTED }}>
            {showNew?"🙈":"👁️"}
          </button>
        </div>
        {errors.newPw && <p style={{ fontSize:11, color:RED, marginTop:4 }}>{errors.newPw}</p>}
      </div>

      {/* 새 비밀번호 확인 */}
      <div>
        <p style={{ fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>새 비밀번호 확인</p>
        <div style={{ position:"relative" }}>
          <input
            type={showConf?"text":"password"}
            value={confirmPw}
            onChange={e=>{ setConfirmPw(e.target.value); setErrors(p=>({...p,confirmPw:""})); }}
            onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); handleReset(); } }}
            placeholder="새 비밀번호 재입력"
            style={inp(!!errors.confirmPw)}
          />
          <button onClick={()=>setShowConf(s=>!s)}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:MUTED }}>
            {showConf?"🙈":"👁️"}
          </button>
        </div>
        {errors.confirmPw && <p style={{ fontSize:11, color:RED, marginTop:4 }}>{errors.confirmPw}</p>}
        {/* 일치 여부 실시간 표시 */}
        {confirmPw && !errors.confirmPw && newPw === confirmPw && (
          <p style={{ fontSize:11, color:"#2D6A4F", marginTop:4 }}>✅ 비밀번호가 일치해요</p>
        )}
      </div>

      {apiErr && (
        <div style={{ padding:"11px 14px", background:"#FFF0F0", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10 }}>
          <p style={{ fontSize:13, color:RED }}>❌ {apiErr}</p>
        </div>
      )}

      <button onClick={handleReset} disabled={loading}
        style={{ width:"100%", padding:14, background:loading?"#C0B8B0":ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor:loading?"default":"pointer", fontFamily:"inherit" }}>
        {loading ? "변경 중…" : "비밀번호 변경하기"}
      </button>

      <button onClick={()=>router.push("/login")}
        style={{ background:"none", border:"none", color:MUTED, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
        로그인으로 돌아가기
      </button>
    </div>
  );
}
