// src/components/settings/InvitePopup.tsx
//
//  커플 연동 / 초대 코드 팝업 컴포넌트
//
//  Fix:
//    ★ 마운트 시 Firestore에서 최신 coupleId 직접 조회
//      → authStore 캐시 값이 stale해도 정확한 모드 결정
//    ★ 3가지 탭 모드:
//       create    → coupleId 없음: 교제 시작일 입력 → 코드 생성
//       show      → coupleId O, 파트너 X: 내 코드 표시
//       enter     → 파트너 코드 입력
//       connected → 파트너 O: 연동 상태 + 해제
"use client";

import { useState, useEffect } from "react";
import { useAuthStore }        from "@/store/authStore";
import { doc, getDoc }         from "firebase/firestore";
import { db }                  from "@/lib/firebase/config";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const SAGE    = "#6B9E7E";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const RED     = "#EF4444";

const inp: React.CSSProperties = {
  width: "100%", padding: "12px 14px", background: WARM,
  border: `1.5px solid ${BORDER}`, borderRadius: 10,
  color: INK, fontSize: 14, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box",
};

type TabMode = "loading" | "create" | "show" | "enter" | "connected";

// ── 서브 컴포넌트: 코드 생성 탭 ─────────────────────────────
function CreateTab({
  onCreated,
  onSwitchToEnter,
}: {
  onCreated: (coupleId: string, code: string) => void;
  onSwitchToEnter: () => void;
}) {
  const { myUid, setCoupleId } = useAuthStore();
  const [sDate,     setSDate]     = useState("");
  const [creating,  setCreating]  = useState(false);
  const [createErr, setCreateErr] = useState("");

  const handleCreate = async () => {
    if (!sDate) { setCreateErr("교제 시작일을 선택해주세요."); return; }
    setCreating(true); setCreateErr("");
    try {
      const { createCouple } = await import("@/lib/firebase/auth");
      const { coupleId: id, inviteCode: code } = await createCouple(myUid, sDate);
      setCoupleId(id);
      onCreated(id, code);
    } catch (e: any) {
      setCreateErr(e.message ?? "코드 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 14, lineHeight: 1.6 }}>
        초대 코드를 만들어 파트너에게 전달하세요.
      </p>
      <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: "block", marginBottom: 6 }}>
        교제 시작일 (D-Day 기준)
      </label>
      <input
        type="date" value={sDate}
        onChange={e => { setSDate(e.target.value); setCreateErr(""); }}
        max={new Date().toISOString().slice(0, 10)}
        style={{ ...inp, marginBottom: 8 }}
      />
      {createErr && (
        <p style={{ fontSize: 12, color: RED, marginBottom: 8 }}>❌ {createErr}</p>
      )}
      <button
        onClick={handleCreate} disabled={creating}
        style={{ width: "100%", padding: 13, background: creating ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: creating ? "default" : "pointer", fontFamily: "inherit", marginBottom: 10 }}>
        {creating ? "생성 중…" : "✨ 초대 코드 만들기"}
      </button>
      <button
        onClick={onSwitchToEnter}
        style={{ width: "100%", padding: 12, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
        파트너 코드 입력하기
      </button>
    </div>
  );
}

// ── 서브 컴포넌트: 코드 표시 (파트너 미연동) ─────────────────
function ShowCodeTab({
  myCode,
  onSwitchToEnter,
}: {
  myCode: string;
  onSwitchToEnter: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 12, lineHeight: 1.6 }}>
        파트너가 아직 연동하지 않았어요.<br />아래 코드를 파트너에게 전달하세요.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1, background: ROSE_LT, borderRadius: 10, padding: "10px 14px", fontFamily: "monospace", fontWeight: 700, color: ROSE, fontSize: 15, letterSpacing: 2 }}>
          {myCode || "불러오는 중..."}
        </div>
        <button
          onClick={handleCopy}
          style={{ padding: "10px 14px", background: copied ? SAGE : "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, color: copied ? "#fff" : MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
          {copied ? "✅" : "📋"}
        </button>
      </div>
      <button
        onClick={onSwitchToEnter}
        style={{ width: "100%", padding: 12, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
        파트너 코드 입력하기
      </button>
    </div>
  );
}

// ── 서브 컴포넌트: 파트너 코드 입력 탭 ──────────────────────
function EnterCodeTab({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const { myUid, setCoupleId } = useAuthStore();
  const [code,       setCode]       = useState("");
  const [joinStatus, setJoinStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [joinMsg,    setJoinMsg]    = useState("");

  const handleCodeInput = (v: string) => {
    let clean = v.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (clean.length > 0 && !clean.startsWith("TASTE-")) {
      clean = "TASTE-" + clean.replace(/^TASTE-?/, "");
    }
    if (clean.length > 12) clean = clean.slice(0, 12);
    setCode(clean);
    setJoinStatus("idle");
    setJoinMsg("");
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    setJoinStatus("loading");
    try {
      const { joinCouple } = await import("@/lib/firebase/auth");
      const newCoupleId = await joinCouple(code.trim(), myUid);
      setCoupleId(newCoupleId);
      setJoinStatus("success");
      setJoinMsg("커플 연동 완료! 🎉");
      setTimeout(onSuccess, 1500);
    } catch (e: any) {
      setJoinStatus("error");
      setJoinMsg(e.message ?? "연동에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>파트너의 초대 코드를 입력하세요</p>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <input
          placeholder="TASTE-XXXXXX" value={code}
          onChange={e => handleCodeInput(e.target.value)}
          style={{
            ...inp, letterSpacing: 3, fontWeight: 600,
            textAlign: "center", fontSize: 16,
            border: `1.5px solid ${joinStatus === "error" ? RED : joinStatus === "success" ? SAGE : BORDER}`,
          }}
        />
        {code.length > 0 && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>
            {/^TASTE-[A-Z0-9]{6}$/.test(code) ? "✅" : "…"}
          </div>
        )}
      </div>
      {joinMsg && (
        <p style={{ fontSize: 12, color: joinStatus === "success" ? SAGE : RED, marginBottom: 8, textAlign: "center" }}>
          {joinMsg}
        </p>
      )}
      <button
        onClick={handleJoin} disabled={joinStatus === "loading"}
        style={{ width: "100%", padding: 13, background: joinStatus === "loading" ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: joinStatus === "loading" ? "default" : "pointer", fontFamily: "inherit", marginBottom: 10 }}>
        {joinStatus === "loading" ? "연동 중…" : "💑 커플 연동하기"}
      </button>
      <button
        onClick={onBack}
        style={{ width: "100%", padding: 12, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
        ← 뒤로
      </button>
    </div>
  );
}

// ── 서브 컴포넌트: 파트너 연동됨 ─────────────────────────────
function ConnectedTab({ onDisconnect }: { onDisconnect: () => void }) {
  const { partnerName, partnerProfileImgUrl, startDate } = useAuthStore();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: WARM, borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: SAGE, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
          {partnerProfileImgUrl
            ? <img src={partnerProfileImgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (partnerName ? partnerName[0] : "?")}
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: INK }}>{partnerName}님과 연동 중 💑</p>
          {startDate && <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>교제 시작일: {startDate}</p>}
        </div>
      </div>
      <button
        onClick={onDisconnect}
        style={{ width: "100%", padding: 12, background: "transparent", border: `1.5px solid ${RED}`, borderRadius: 12, color: RED, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
        💔 커플 연동 해제
      </button>
    </div>
  );
}

// ── 서브 컴포넌트: 연동 해제 확인 다이얼로그 ────────────────
function DisconnectConfirm({
  onConfirm, onClose, loading,
}: {
  onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 300, background: "#fff", borderRadius: 20, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>💔</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 8 }}>연동을 해제할까요?</p>
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 20 }}>
          기록 데이터는 유지되지만<br />서로의 기록을 볼 수 없게 됩니다.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={loading}
            style={{ flex: 1, padding: 12, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            취소
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 2, padding: 12, background: loading ? "#C0B8B0" : RED, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
            {loading ? "해제 중…" : "연동 해제"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────
export function InvitePopup({ onClose }: { onClose: () => void }) {
  const { myUid, partnerName, setCoupleId } = useAuthStore();

  const [mode,          setMode]          = useState<TabMode>("loading");
  const [myCode,        setMyCode]        = useState("");
  const [realCoupleId,  setRealCoupleId]  = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);

  // ★ 마운트 시 Firestore에서 최신 coupleId 직접 조회
  //   authStore 캐시가 stale해도 정확한 상태 파악
  useEffect(() => {
    if (!myUid) { setMode("create"); return; }

    getDoc(doc(db, "users", myUid)).then(async snap => {
      const freshCoupleId = snap.data()?.coupleId ?? null;
      setRealCoupleId(freshCoupleId);
      // authStore도 최신 값으로 동기화
      setCoupleId(freshCoupleId);

      if (!freshCoupleId) {
        // coupleId 없음 → 코드 생성
        setMode("create");
        return;
      }

      // coupleId 있음 → couples 문서에서 inviteCode + user2Uid 확인
      try {
        const { fetchCouple } = await import("@/lib/firebase/auth");
        const couple = await fetchCouple(freshCoupleId);
        if (!couple) {
          // couples 문서 없음 (고아 데이터) → 초기화
          setCoupleId(null);
          setRealCoupleId(null);
          setMode("create");
          return;
        }
        setMyCode(couple.inviteCode ?? "");
        // user2Uid 있고 파트너 이름 있으면 연동 완료
        if (couple.user2Uid && partnerName) {
          setMode("connected");
        } else {
          // 코드만 있고 파트너 미연동
          setMode("show");
        }
      } catch {
        setMode("create");
      }
    }).catch(() => {
      setMode("create");
    });
  }, [myUid]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDisconnect = async () => {
    if (!realCoupleId) return;
    setDisconnecting(true);
    try {
      const { disconnectCouple } = await import("@/lib/firebase/auth");
      await disconnectCouple(myUid, realCoupleId);
      setCoupleId(null);
      setRealCoupleId(null);
      setShowConfirm(false);
      onClose();
    } catch {
      alert("연동 해제에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ width: "100%", maxWidth: 340, background: "#fff", borderRadius: 20, padding: 24, animation: "scaleIn 0.18s ease both", maxHeight: "90vh", overflowY: "auto" }}
        >
          {/* 헤더 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: INK }}>커플 연동 / 초대 코드</p>
            <button onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: MUTED, padding: 4 }}>×</button>
          </div>

          {/* 로딩 */}
          {mode === "loading" && (
            <div style={{ textAlign: "center", padding: "24px 0", color: MUTED, fontSize: 13 }}>
              <div style={{ width: 28, height: 28, border: `3px solid ${ROSE_LT}`, borderTopColor: ROSE, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              불러오는 중...
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {/* 코드 생성 */}
          {mode === "create" && (
            <CreateTab
              onCreated={(id, code) => {
                setRealCoupleId(id);
                setMyCode(code);
                setMode("show");
              }}
              onSwitchToEnter={() => setMode("enter")}
            />
          )}

          {/* 코드 표시 */}
          {mode === "show" && (
            <ShowCodeTab
              myCode={myCode}
              onSwitchToEnter={() => setMode("enter")}
            />
          )}

          {/* 파트너 코드 입력 */}
          {mode === "enter" && (
            <EnterCodeTab
              onBack={() => setMode(realCoupleId ? "show" : "create")}
              onSuccess={onClose}
            />
          )}

          {/* 연동 완료 */}
          {mode === "connected" && (
            <ConnectedTab onDisconnect={() => setShowConfirm(true)} />
          )}
        </div>
      </div>

      {showConfirm && (
        <DisconnectConfirm
          onConfirm={handleDisconnect}
          onClose={() => setShowConfirm(false)}
          loading={disconnecting}
        />
      )}
    </>
  );
}
