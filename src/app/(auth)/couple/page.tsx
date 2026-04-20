// ============================================================
//  couple/page.tsx  적용 경로: src/app/(auth)/couple/page.tsx
//
//  Fix:
//    - 커플 연동 성공 시 축하 팝업 표시 후 홈 이동
//    - 코드 만들기 성공 후에도 팝업 표시
// ============================================================
"use client";

import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import { createCouple, joinCouple } from "@/lib/firebase/auth";
import { useAuthStore }        from "@/store/authStore";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const SAGE    = "#6B9E7E";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";

type Mode   = "create" | "join";
type Status = "idle" | "empty" | "invalid" | "error" | "success" | "loading";

// ── 플로팅 토스트 ────────────────────────────────────────────
function StatusToast({ status, msg }: { status: Status; msg: string }) {
  if (status === "idle" || status === "loading") return null;
  const styles: Record<string, { bg: string; color: string; icon: string }> = {
    empty:   { bg: "#FFF3CD", color: "#856404", icon: "⚠️" },
    invalid: { bg: "#F8D7DA", color: "#842029", icon: "❌" },
    error:   { bg: "#F8D7DA", color: "#842029", icon: "❌" },
    success: { bg: "#D1F0E0", color: "#0A5C36", icon: "✅" },
  };
  const s = styles[status] ?? styles.error;
  return (
    <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: s.bg, color: s.color, borderRadius: 14, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 9999, display: "flex", alignItems: "center", gap: 8, maxWidth: 320, whiteSpace: "nowrap", animation: "slideUp 0.25s ease" }}>
      <span>{s.icon}</span>
      <span>{msg}</span>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

// ── 커플 연동 완료 팝업 ──────────────────────────────────────
function CoupleSuccessPopup({ partnerName, onStart }: { partnerName?: string; onStart: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.2s ease" }}>
      <div style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 24, padding: "32px 24px", textAlign: "center", animation: "scaleIn 0.25s ease" }}>
        {/* 하트 애니메이션 */}
        <div style={{ fontSize: 60, marginBottom: 4, animation: "heartBeat 0.6s ease 0.2s both" }}>💑</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {["❤️","🎉","✨"].map((e, i) => (
            <span key={i} style={{ fontSize: 22, animation: `popIn 0.4s ease ${0.3 + i * 0.1}s both` }}>{e}</span>
          ))}
        </div>

        <p style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 8 }}>연동 완료!</p>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
          {partnerName
            ? <><strong style={{ color: ROSE }}>{partnerName}</strong>님과 연동됐어요.<br />이제 함께 맛집을 기록해보세요 🍽️</>
            : <>파트너와 연동됐어요.<br />이제 함께 맛집을 기록해보세요 🍽️</>
          }
        </p>

        <button
          onClick={onStart}
          style={{ width: "100%", padding: "14px 0", background: ROSE, border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          맛지도 시작하기 🗺️
        </button>
      </div>

      <style>{`
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn  { from { opacity:0; transform:scale(0.88) } to { opacity:1; transform:scale(1) } }
        @keyframes heartBeat { 0%,100% { transform:scale(1) } 30% { transform:scale(1.25) } 60% { transform:scale(0.95) } }
        @keyframes popIn    { from { opacity:0; transform:scale(0.5) } to { opacity:1; transform:scale(1) } }
      `}</style>
    </div>
  );
}

// ── 코드 생성 완료 팝업 ──────────────────────────────────────
function CodeCreatedPopup({ inviteCode, onClose, onCopy }: { inviteCode: string; onClose: () => void; onCopy: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.2s ease" }}>
      <div style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 24, padding: "32px 24px", textAlign: "center", animation: "scaleIn 0.25s ease" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
        <p style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 6 }}>초대 코드 생성 완료!</p>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>파트너에게 아래 코드를 전달하세요</p>

        <div style={{ background: ROSE_LT, borderRadius: 16, padding: "18px 24px", marginBottom: 16 }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: ROSE, letterSpacing: 4, fontFamily: "monospace" }}>{inviteCode}</p>
        </div>

        <button
          onClick={onCopy}
          style={{ padding: "8px 20px", background: SAGE, border: "none", borderRadius: 20, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}>
          📋 코드 복사
        </button>

        <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 20 }}>
          파트너가 이 코드를 입력하면<br/>자동으로 연동됩니다.
        </p>

        <button onClick={onClose}
          style={{ width: "100%", padding: "12px 0", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 14, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          나중에 연동하기
        </button>
      </div>
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.88) } to { opacity:1; transform:scale(1) } }
      `}</style>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────
export default function CouplePage() {
  const router = useRouter();
  const { myUid, partnerName, setCoupleId, setStartDate: setAuthStartDate } = useAuthStore();

  const [mode,        setMode]        = useState<Mode>("create");
  const [startDate,   setStartDate]   = useState("");
  const [inviteCode,  setInviteCode]  = useState("");
  const [inputCode,   setInputCode]   = useState("");
  const [status,      setStatus]      = useState<Status>("idle");
  const [statusMsg,   setStatusMsg]   = useState("");

  // ★ 팝업 상태
  const [showCodePopup,    setShowCodePopup]    = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [copied,           setCopied]           = useState(false);

  // 토스트 자동 숨김
  useEffect(() => {
    if (status === "idle" || status === "loading") return;
    const t = setTimeout(() => setStatus("idle"), 3000);
    return () => clearTimeout(t);
  }, [status]);

  const showStatus = (s: Status, msg: string) => { setStatus(s); setStatusMsg(msg); };

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", background: WARM,
    border: `1.5px solid ${BORDER}`, borderRadius: 10,
    color: INK, fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  };

  // ── 코드 만들기
  const handleCreate = async () => {
    if (!startDate) { showStatus("empty", "교제 시작일을 선택해주세요."); return; }
    setStatus("loading");
    try {
      const { coupleId, inviteCode: code } = await createCouple(myUid, startDate);
      setCoupleId(coupleId);
      setAuthStartDate(startDate);
      setInviteCode(code);
      setStatus("idle");
      setShowCodePopup(true); // ★ 코드 생성 팝업
    } catch (e: any) {
      showStatus("error", e.message ?? "코드 생성에 실패했어요.");
    }
  };

  // ── 코드 입력하기
  const handleJoin = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code)                              { showStatus("empty",   "초대 코드를 입력해주세요."); return; }
    if (!/^TASTE-[A-Z0-9]{6}$/.test(code)) { showStatus("invalid", "코드 형식이 맞지 않아요. (TASTE-XXXXXX)"); return; }

    setStatus("loading");
    try {
      const coupleId = await joinCouple(code, myUid);
      setCoupleId(coupleId);
      setStatus("idle");
      setShowSuccessPopup(true); // ★ 연동 완료 팝업
    } catch (e: any) {
      const msg = e.message ?? "";
      if (msg.includes("not found") || msg.includes("없")) {
        showStatus("invalid", "코드가 올바르지 않아요. 다시 확인해주세요.");
      } else {
        showStatus("error", msg || "연동에 실패했어요. 다시 시도해주세요.");
      }
    }
  };

  // ── 코드 포맷
  const handleCodeInput = (v: string) => {
    let clean = v.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (clean.length > 0 && !clean.startsWith("TASTE-")) {
      if ("TASTE-".startsWith(clean)) { clean = clean; }
      else { clean = "TASTE-" + clean.replace(/^TASTE-?/, ""); }
    }
    if (clean.length > 12) clean = clean.slice(0, 12);
    setInputCode(clean);
    setStatus("idle");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showStatus("success", "클립보드에 복사됐어요!");
  };

  const isLoading = status === "loading";

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, marginBottom: 6 }}>커플 연동</h2>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>파트너와 연동해야 함께 기록을 볼 수 있어요 💑</p>

      {/* 탭 */}
      <div style={{ display: "flex", background: WARM, borderRadius: 12, padding: 3, border: `1px solid ${BORDER}`, marginBottom: 24 }}>
        {(["create", "join"] as const).map(m => (
          <button key={m}
            onClick={() => { setMode(m); setStatus("idle"); setInviteCode(""); setInputCode(""); }}
            style={{ flex: 1, padding: 10, border: "none", borderRadius: 9, background: mode === m ? "#fff" : "transparent", color: mode === m ? ROSE : MUTED, fontSize: 14, fontWeight: mode === m ? 700 : 400, cursor: "pointer", fontFamily: "inherit", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
            {m === "create" ? "코드 만들기" : "코드 입력하기"}
          </button>
        ))}
      </div>

      {/* 코드 만들기 탭 */}
      {mode === "create" && (
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: "block", marginBottom: 8 }}>교제 시작일 (D-Day 기준)</label>
          <input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setStatus("idle"); }}
            max={new Date().toISOString().slice(0, 10)}
            style={{ ...inp, marginBottom: 16, border: `1.5px solid ${status === "empty" ? "#EF4444" : BORDER}` }}
          />
          <button onClick={handleCreate} disabled={isLoading}
            style={{ width: "100%", padding: 13, background: isLoading ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: isLoading ? "default" : "pointer", fontFamily: "inherit" }}>
            {isLoading ? "생성 중…" : "✨ 초대 코드 만들기"}
          </button>
        </div>
      )}

      {/* 코드 입력하기 탭 */}
      {mode === "join" && (
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: "block", marginBottom: 8 }}>파트너의 초대 코드 입력</label>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              placeholder="TASTE-XXXXXX"
              value={inputCode}
              onChange={e => handleCodeInput(e.target.value)}
              style={{ ...inp, letterSpacing: 3, fontWeight: 600, textAlign: "center", fontSize: 16, border: `1.5px solid ${status === "empty" || status === "invalid" ? "#EF4444" : status === "success" ? SAGE : BORDER}` }}
            />
            {inputCode.length > 0 && (
              <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>
                {/^TASTE-[A-Z0-9]{6}$/.test(inputCode) ? "✅" : "…"}
              </div>
            )}
          </div>
          <p style={{ fontSize: 11, color: MUTED, marginBottom: 16, textAlign: "center" }}>형식: TASTE-XXXXXX (대문자+숫자 6자리)</p>
          <button onClick={handleJoin} disabled={isLoading}
            style={{ width: "100%", padding: 13, background: isLoading ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: isLoading ? "default" : "pointer", fontFamily: "inherit" }}>
            {isLoading ? "연동 중…" : "💑 커플 연동하기"}
          </button>
        </div>
      )}

      {/* 플로팅 상태 토스트 */}
      <StatusToast status={status} msg={statusMsg} />

      {/* ★ 코드 생성 완료 팝업 */}
      {showCodePopup && (
        <CodeCreatedPopup
          inviteCode={inviteCode}
          onCopy={handleCopy}
          onClose={() => { setShowCodePopup(false); router.push("/"); }}
        />
      )}

      {/* ★ 커플 연동 성공 팝업 */}
      {showSuccessPopup && (
        <CoupleSuccessPopup
          partnerName={partnerName || undefined}
          onStart={() => { setShowSuccessPopup(false); router.push("/"); }}
        />
      )}
    </div>
  );
}
