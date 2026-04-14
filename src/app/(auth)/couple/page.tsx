// ============================================================
//  couple/page.tsx  적용 경로: src/app/(auth)/couple/page.tsx
//
//  Fix 6:
//    - 버튼 클릭 반응 없음 → setCoupleId/setStartDate authStore 연결
//    - 플로팅 팝업: 미입력/코드 틀림/성공 상태 표시
//    - 코드 입력 실시간 포맷 (TASTE-XXXXXX)
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

// ── 플로팅 토스트 컴포넌트 ──────────────────────────────────
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
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
      background: s.bg, color: s.color, borderRadius: 14,
      padding: "12px 20px", fontSize: 13, fontWeight: 600,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 9999,
      display: "flex", alignItems: "center", gap: 8,
      maxWidth: 320, whiteSpace: "nowrap",
      animation: "slideUp 0.25s ease",
    }}>
      <span>{s.icon}</span>
      <span>{msg}</span>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

export default function CouplePage() {
  const router = useRouter();
  const { myUid, setCoupleId, setStartDate: setAuthStartDate } = useAuthStore();

  const [mode,       setMode]       = useState<Mode>("create");
  const [startDate,  setStartDate]  = useState("");
  const [inviteCode, setInviteCode] = useState("");  // 생성된 코드
  const [inputCode,  setInputCode]  = useState("");  // 입력한 코드
  const [status,     setStatus]     = useState<Status>("idle");
  const [statusMsg,  setStatusMsg]  = useState("");

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

  // ── 코드 만들기 ──────────────────────────────────────────
  const handleCreate = async () => {
    if (!startDate) {
      showStatus("empty", "교제 시작일을 선택해주세요.");
      return;
    }
    setStatus("loading");
    try {
      const { coupleId, inviteCode: code } = await createCouple(myUid, startDate);
      setCoupleId(coupleId);
      setAuthStartDate(startDate);
      setInviteCode(code);
      showStatus("success", "초대 코드가 생성됐어요! 🎉");
    } catch (e: any) {
      showStatus("error", e.message ?? "코드 생성에 실패했어요.");
    }
  };

  // ── 코드 입력하기 ────────────────────────────────────────
  const handleJoin = async () => {
    const code = inputCode.trim().toUpperCase();

    if (!code) {
      showStatus("empty", "초대 코드를 입력해주세요.");
      return;
    }
    if (!/^TASTE-[A-Z0-9]{6}$/.test(code)) {
      showStatus("invalid", "코드 형식이 맞지 않아요. (TASTE-XXXXXX)");
      return;
    }

    setStatus("loading");
    try {
      const coupleId = await joinCouple(code, myUid);
      setCoupleId(coupleId);
      showStatus("success", "커플 연동 성공! 💑");
      setTimeout(() => router.push("/"), 1200);
    } catch (e: any) {
      const msg = e.message ?? "";
      if (msg.includes("not found") || msg.includes("없")) {
        showStatus("invalid", "코드가 올바르지 않아요. 다시 확인해주세요.");
      } else {
        showStatus("error", msg || "연동에 실패했어요. 다시 시도해주세요.");
      }
    }
  };

  // ── 코드 포맷 자동 적용 ─────────────────────────────────
  const handleCodeInput = (v: string) => {
    let clean = v.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    // TASTE- 접두사 자동 보완
    if (clean.length > 0 && !clean.startsWith("TASTE-")) {
      if ("TASTE-".startsWith(clean)) {
        clean = clean;
      } else {
        clean = "TASTE-" + clean.replace(/^TASTE-?/, "");
      }
    }
    if (clean.length > 12) clean = clean.slice(0, 12);
    setInputCode(clean);
    setStatus("idle");
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

      {mode === "create" ? (
        inviteCode ? (
          /* 코드 생성 완료 */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>파트너에게 아래 코드를 전달하세요</p>
            <div style={{ background: ROSE_LT, borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 26, fontWeight: 800, color: ROSE, letterSpacing: 4 }}>{inviteCode}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(inviteCode); showStatus("success", "클립보드에 복사됐어요!"); }}
              style={{ fontSize: 13, color: ROSE, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              📋 코드 복사
            </button>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 12, lineHeight: 1.6 }}>
              파트너가 이 코드를 입력하면<br/>자동으로 연동됩니다.
            </p>
            <button onClick={() => router.push("/")}
              style={{ width: "100%", marginTop: 24, padding: 13, background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              나중에 연동하기
            </button>
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: "block", marginBottom: 8 }}>
              교제 시작일 (D-Day 기준)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setStatus("idle"); }}
              max={new Date().toISOString().slice(0, 10)}
              style={{
                ...inp, marginBottom: 16,
                border: `1.5px solid ${status === "empty" ? "#EF4444" : BORDER}`,
              }}
            />
            <button onClick={handleCreate} disabled={isLoading}
              style={{ width: "100%", padding: 13, background: isLoading ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: isLoading ? "default" : "pointer", fontFamily: "inherit" }}>
              {isLoading ? "생성 중…" : "✨ 초대 코드 만들기"}
            </button>
          </div>
        )
      ) : (
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: "block", marginBottom: 8 }}>
            파트너의 초대 코드 입력
          </label>

          {/* 코드 입력 필드 + 실시간 유효성 표시 */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              placeholder="TASTE-XXXXXX"
              value={inputCode}
              onChange={e => handleCodeInput(e.target.value)}
              style={{
                ...inp,
                letterSpacing: 3, fontWeight: 600, textAlign: "center", fontSize: 16,
                border: `1.5px solid ${
                  status === "empty" || status === "invalid" ? "#EF4444"
                  : status === "success" ? SAGE
                  : BORDER
                }`,
              }}
            />
            {/* 입력 상태 인디케이터 */}
            {inputCode.length > 0 && (
              <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>
                {/^TASTE-[A-Z0-9]{6}$/.test(inputCode) ? "✅" : "…"}
              </div>
            )}
          </div>

          {/* 형식 안내 */}
          <p style={{ fontSize: 11, color: MUTED, marginBottom: 16, textAlign: "center" }}>
            형식: TASTE-XXXXXX (대문자+숫자 6자리)
          </p>

          <button onClick={handleJoin} disabled={isLoading}
            style={{ width: "100%", padding: 13, background: isLoading ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: isLoading ? "default" : "pointer", fontFamily: "inherit" }}>
            {isLoading ? "연동 중…" : "💑 커플 연동하기"}
          </button>
        </div>
      )}

      {/* ★ 플로팅 상태 토스트 */}
      <StatusToast status={status} msg={statusMsg} />
    </div>
  );
}
