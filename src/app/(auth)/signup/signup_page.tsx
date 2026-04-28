// ============================================================
//  signup/page.tsx  적용 경로: src/app/(auth)/signup/page.tsx
//
//  이메일 인증 필수 추가:
//    1. signUp() 후 인증 메일 자동 발송
//    2. 인증 대기 화면으로 전환
//    3. "인증 완료했어요" → emailVerified 확인 후 /couple 이동
//    4. 재발송 버튼 (60초 쿨다운)
//    5. "다시 가입" → 미인증 계정 삭제 후 폼으로 복귀
// ============================================================
"use client";

import { useState }                                     from "react";
import { useRouter }                                    from "next/navigation";
import { sendEmailVerification, deleteUser }            from "firebase/auth";
import { auth }                                         from "@/lib/firebase/config";
import { signUp }                                       from "@/lib/firebase/auth";
import {
  validateEmail, validatePassword,
  validatePasswordConfirm, validateNickname,
} from "@/lib/utils/validation";

const ROSE  = "#C96B52";
const SAGE  = "#6B9E7E";
const INK   = "#1A1412";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";
const WARM  = "#FAF7F3";

function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>{msg}</p>;
}

function pwStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)                                                        score++;
  if (/[A-Z]/.test(pw))                                                      score++;
  if (/[0-9]/.test(pw))                                                      score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw))                    score++;
  const labels = ["", "약함", "보통", "강함", "매우 강함"];
  const colors = ["", "#EF4444", "#F59E0B", "#6B9E7E", "#059669"];
  return { score, label: labels[score] ?? "", color: colors[score] ?? "" };
}

/* ── 인증 대기 화면 ─────────────────────────────────────── */
function VerifyEmailScreen({
  email,
  onConfirm,
  onBack,
}: {
  email: string;
  onConfirm: () => Promise<void>;
  onBack: () => Promise<void>;
}) {
  const [checking,   setChecking]   = useState(false);
  const [resending,  setResending]  = useState(false);
  const [cooldown,   setCooldown]   = useState(0);
  const [checkErr,   setCheckErr]   = useState("");

  // 재발송
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      const user = auth.currentUser;
      if (user) await sendEmailVerification(user);
      // 60초 쿨다운
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } finally {
      setResending(false);
    }
  };

  // 인증 확인
  const handleConfirm = async () => {
    setChecking(true);
    setCheckErr("");
    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        await onConfirm();
      } else {
        setCheckErr("아직 인증이 완료되지 않았어요. 메일함을 확인해주세요.");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "10px 0" }}>
      {/* 아이콘 */}
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#FFF0EC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
        📧
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: INK, marginBottom: 8 }}>이메일을 확인해주세요</p>
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
          <strong style={{ color: ROSE }}>{email}</strong>으로<br />
          인증 메일을 보냈어요.<br />
          메일의 링크를 클릭한 후 아래 버튼을 눌러주세요.
        </p>
      </div>

      {checkErr && (
        <div style={{ width: "100%", padding: "11px 14px", background: "#FFF0F0", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>
          <p style={{ fontSize: 13, color: "#EF4444", textAlign: "center" }}>❌ {checkErr}</p>
        </div>
      )}

      {/* 인증 완료 확인 버튼 */}
      <button
        onClick={handleConfirm}
        disabled={checking}
        style={{ width: "100%", padding: 14, background: checking ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: checking ? "default" : "pointer", fontFamily: "inherit" }}
      >
        {checking ? "확인 중…" : "✅ 인증 완료했어요"}
      </button>

      {/* 재발송 */}
      <button
        onClick={handleResend}
        disabled={cooldown > 0 || resending}
        style={{ width: "100%", padding: 13, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: cooldown > 0 ? "#C0B8B0" : MUTED, fontSize: 14, cursor: cooldown > 0 ? "default" : "pointer", fontFamily: "inherit" }}
      >
        {resending ? "발송 중…" : cooldown > 0 ? `재발송 (${cooldown}초 후 가능)` : "📨 인증 메일 재발송"}
      </button>

      {/* 다시 가입 */}
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}
      >
        다른 이메일로 가입하기
      </button>
    </div>
  );
}

/* ── 메인 컴포넌트 ──────────────────────────────────────── */
export default function SignupPage() {
  const router = useRouter();

  // step: "form" | "verify"
  const [step,    setStep]    = useState<"form" | "verify">("form");

  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [pwc,     setPwc]     = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [errors,  setErrors]  = useState({ name: "", email: "", pw: "", pwc: "" });
  const [apiErr,  setApiErr]  = useState("");
  const [loading, setLoading] = useState(false);

  const inp = (hasErr: boolean): React.CSSProperties => ({
    width: "100%", padding: "13px 14px", background: WARM,
    border: `1.5px solid ${hasErr ? "#EF4444" : BORDER}`,
    borderRadius: 12, color: INK, fontSize: 15,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
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

  /* ── 회원가입 → 인증 메일 발송 ── */
  const handleSignup = async () => {
    if (!validate()) return;
    setApiErr(""); setLoading(true);
    try {
      await signUp(email, pw, name.trim());
      // 인증 메일 발송
      const user = auth.currentUser;
      if (user) await sendEmailVerification(user);
      // 인증 대기 화면으로 전환
      setStep("verify");
    } catch (e: any) {
      const msg = e.code ?? e.message ?? "";
      if (msg.includes("email-already-in-use")) setApiErr("이미 사용 중인 이메일입니다.");
      else if (msg.includes("weak-password"))   setApiErr("비밀번호가 너무 약합니다.");
      else setApiErr("회원가입에 실패했습니다. 다시 시도해주세요.");
    } finally { setLoading(false); }
  };

  /* ── 인증 완료 확인 → /couple 이동 ── */
  const handleVerified = async () => {
    router.push("/couple");
  };

  /* ── 미인증 계정 삭제 → 폼으로 복귀 ── */
  const handleBack = async () => {
    try {
      const user = auth.currentUser;
      if (user) await deleteUser(user);
    } catch {
      // 삭제 실패해도 폼으로 복귀
    }
    setStep("form");
    setPw(""); setPwc("");
    setApiErr("");
  };

  /* ── 인증 대기 화면 ── */
  if (step === "verify") {
    return (
      <VerifyEmailScreen
        email={email}
        onConfirm={handleVerified}
        onBack={handleBack}
      />
    );
  }

  /* ── 가입 폼 ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 닉네임 */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>닉네임</p>
        <input value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
          placeholder="2~10자 (한글/영문/숫자)" maxLength={10} style={inp(!!errors.name)} />
        <FieldError msg={errors.name} />
        {!errors.name && name && <p style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>앱 내에서 사용할 이름이에요</p>}
      </div>

      {/* 이메일 */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>이메일</p>
        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
          placeholder="example@email.com" style={inp(!!errors.email)} />
        <FieldError msg={errors.email} />
      </div>

      {/* 비밀번호 */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>비밀번호</p>
        <div style={{ position: "relative" }}>
          <input type={showPw ? "text" : "password"} value={pw} onChange={e => { setPw(e.target.value); setErrors(p => ({ ...p, pw: "" })); }}
            placeholder="8~20자, 영문+숫자+특수문자" style={{ ...inp(!!errors.pw), paddingRight: 44 }} />
          <button onClick={() => setShowPw(s => !s)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: MUTED }}>
            {showPw ? "🙈" : "👁️"}
          </button>
        </div>
        {pw && !errors.pw && (
          <div style={{ marginTop: 6 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : "#E2DDD8", transition: "background 0.2s" }} />
              ))}
            </div>
            <p style={{ fontSize: 11, color: strength.color }}>{strength.label}</p>
          </div>
        )}
        <FieldError msg={errors.pw} />
      </div>

      {/* 비밀번호 확인 */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>비밀번호 확인</p>
        <input type="password" value={pwc} onChange={e => { setPwc(e.target.value); setErrors(p => ({ ...p, pwc: "" })); }}
          placeholder="비밀번호 재입력" style={inp(!!errors.pwc)} />
        {!errors.pwc && pwc && pw === pwc && <p style={{ fontSize: 11, color: SAGE, marginTop: 4 }}>✅ 비밀번호가 일치합니다.</p>}
        <FieldError msg={errors.pwc} />
      </div>

      {apiErr && (
        <div style={{ padding: "11px 14px", background: "#FFF0F0", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>
          <p style={{ fontSize: 13, color: "#EF4444" }}>❌ {apiErr}</p>
        </div>
      )}

      <button onClick={handleSignup} disabled={loading}
        style={{ width: "100%", padding: 14, background: loading ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
        {loading ? "가입 중…" : "시작하기 🍽️"}
      </button>

      <p style={{ textAlign: "center", fontSize: 13, color: MUTED }}>
        이미 계정이 있으신가요?{" "}
        <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", color: ROSE, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>로그인</button>
      </p>
    </div>
  );
}
