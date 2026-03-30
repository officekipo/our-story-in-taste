// src/app/(auth)/couple/page.tsx
"use client";

import { useState }  from "react";
import { useRouter } from "next/navigation";
import { createCouple, joinCouple } from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/authStore";

const ROSE   = "#C96B52";
const ROSE_LT = "#F2D5CC";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

type Mode = "create" | "join";

export default function CouplePage() {
  const router  = useRouter();
  const { myUid, setCoupleId, setStartDate } = useAuthStore();

  const [mode,        setMode]       = useState<Mode>("create");
  const [startDate,   setStartDateL] = useState("");
  const [inviteCode,  setInviteCode] = useState("");   // 생성된 코드
  const [inputCode,   setInputCode]  = useState("");   // 입력한 코드
  const [error,       setError]      = useState("");
  const [loading,     setLoading]    = useState(false);

  const inp: React.CSSProperties = { width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  const handleCreate = async () => {
    if (!startDate) { setError("교제 시작일을 선택해주세요."); return; }
    setError(""); setLoading(true);
    try {
      const { coupleId, inviteCode: code } = await createCouple(myUid, startDate);
      setCoupleId(coupleId);
      setStartDate(startDate);
      setInviteCode(code);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inputCode.trim()) { setError("초대 코드를 입력해주세요."); return; }
    setError(""); setLoading(true);
    try {
      const coupleId = await joinCouple(inputCode.trim(), myUid);
      setCoupleId(coupleId);
      router.push("/");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, marginBottom: 6 }}>커플 연동</h2>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>파트너와 연동해야 함께 기록을 볼 수 있어요 💑</p>

      {/* 탭 */}
      <div style={{ display: "flex", background: WARM, borderRadius: 12, padding: 3, border: `1px solid ${BORDER}`, marginBottom: 24 }}>
        {(["create", "join"] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setError(""); setInviteCode(""); }} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 9, background: mode === m ? "#fff" : "transparent", color: mode === m ? ROSE : MUTED, fontSize: 14, fontWeight: mode === m ? 700 : 400, cursor: "pointer", fontFamily: "inherit", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
            {m === "create" ? "코드 만들기" : "코드 입력하기"}
          </button>
        ))}
      </div>

      {mode === "create" ? (
        inviteCode ? (
          /* 코드 생성 완료 */
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>파트너에게 아래 코드를 전달하세요</p>
            <div style={{ background: ROSE_LT, borderRadius: 16, padding: "20px", marginBottom: 16 }}>
              <p style={{ fontSize: 26, fontWeight: 800, color: ROSE, letterSpacing: 4 }}>{inviteCode}</p>
            </div>
            <button onClick={() => navigator.clipboard.writeText(inviteCode)} style={{ fontSize: 13, color: ROSE, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>코드 복사</button>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>파트너가 코드를 입력하면 자동으로 연동됩니다.</p>
            <button onClick={() => router.push("/")} style={{ width: "100%", marginTop: 24, padding: 13, background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>나중에 연동하기</button>
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: "block", marginBottom: 8 }}>교제 시작일 (D-Day 기준)</label>
            <input type="date" value={startDate} onChange={e => setStartDateL(e.target.value)} max={new Date().toISOString().slice(0, 10)} style={{ ...inp, marginBottom: error ? 8 : 16 }} />
            {error && <p style={{ fontSize: 12, color: "#EF4444", marginBottom: 12 }}>{error}</p>}
            <button onClick={handleCreate} disabled={loading} style={{ width: "100%", padding: 13, background: loading ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
              {loading ? "생성 중..." : "초대 코드 만들기"}
            </button>
          </div>
        )
      ) : (
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: "block", marginBottom: 8 }}>파트너의 초대 코드 입력</label>
          <input placeholder="TASTE-XXXXXX" value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())} style={{ ...inp, letterSpacing: 3, fontWeight: 600, textAlign: "center", fontSize: 16, marginBottom: error ? 8 : 16 }} />
          {error && <p style={{ fontSize: 12, color: "#EF4444", marginBottom: 12 }}>{error}</p>}
          <button onClick={handleJoin} disabled={loading} style={{ width: "100%", padding: 13, background: loading ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
            {loading ? "연동 중..." : "커플 연동하기"}
          </button>
        </div>
      )}
    </div>
  );
}
