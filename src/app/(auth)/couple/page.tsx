// ============================================================
//  couple/page.tsx  적용 경로: src/app/(auth)/couple/page.tsx
// ============================================================
"use client";

import { useState, useEffect }              from "react";
import { useRouter }                        from "next/navigation";
import { createCouple, joinCouple, disconnectCouple } from "@/lib/firebase/auth";
import { useAuthStore }                     from "@/store/authStore";
import { calcDDay }                         from "@/lib/utils/date";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const SAGE    = "#6B9E7E";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const RED     = "#EF4444";

type Mode   = "create" | "join";
type Status = "idle" | "empty" | "invalid" | "error" | "success" | "loading";

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
    <div style={{ position:"fixed", bottom:32, left:"50%", transform:"translateX(-50%)", background:s.bg, color:s.color, borderRadius:14, padding:"12px 20px", fontSize:13, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,0.15)", zIndex:9999, display:"flex", alignItems:"center", gap:8, maxWidth:320, whiteSpace:"nowrap", animation:"slideUp 0.25s ease" }}>
      <span>{s.icon}</span><span>{msg}</span>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}

function CoupleSuccessPopup({ partnerName, onStart }: { partnerName?: string; onStart: () => void }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24, animation:"fadeIn 0.2s ease" }}>
      <div style={{ width:"100%", maxWidth:320, background:"#fff", borderRadius:24, padding:"32px 24px", textAlign:"center", animation:"scaleIn 0.25s ease" }}>
        <div style={{ fontSize:60, marginBottom:4, animation:"heartBeat 0.6s ease 0.2s both" }}>💑</div>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:20 }}>
          {["❤️","🎉","✨"].map((e,i)=><span key={i} style={{ fontSize:22, animation:`popIn 0.4s ease ${0.3+i*0.1}s both` }}>{e}</span>)}
        </div>
        <p style={{ fontSize:22, fontWeight:800, color:INK, marginBottom:8 }}>연동 완료!</p>
        <p style={{ fontSize:14, color:MUTED, lineHeight:1.7, marginBottom:24 }}>
          {partnerName
            ? <><strong style={{ color:ROSE }}>{partnerName}</strong>님과 연동됐어요.<br/>이제 함께 맛집을 기록해보세요 🍽️</>
            : <>파트너와 연동됐어요.<br/>이제 함께 맛집을 기록해보세요 🍽️</>}
        </p>
        <button onClick={onStart} style={{ width:"100%", padding:"14px 0", background:ROSE, border:"none", borderRadius:14, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          맛지도 시작하기 🗺️
        </button>
      </div>
      <style>{`
        @keyframes fadeIn    {from{opacity:0}to{opacity:1}}
        @keyframes scaleIn   {from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}
        @keyframes heartBeat {0%,100%{transform:scale(1)}30%{transform:scale(1.25)}60%{transform:scale(0.95)}}
        @keyframes popIn     {from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}
      `}</style>
    </div>
  );
}

function CodeCreatedPopup({ inviteCode, onClose, onCopy }: { inviteCode:string; onClose:()=>void; onCopy:()=>void }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24, animation:"fadeIn 0.2s ease" }}>
      <div style={{ width:"100%", maxWidth:320, background:"#fff", borderRadius:24, padding:"32px 24px", textAlign:"center", animation:"scaleIn 0.25s ease" }}>
        <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
        <p style={{ fontSize:20, fontWeight:800, color:INK, marginBottom:6 }}>초대 코드 생성 완료!</p>
        <p style={{ fontSize:13, color:MUTED, marginBottom:20 }}>파트너에게 아래 코드를 전달하세요</p>
        <div style={{ background:ROSE_LT, borderRadius:16, padding:"18px 24px", marginBottom:16 }}>
          <p style={{ fontSize:26, fontWeight:800, color:ROSE, letterSpacing:4, fontFamily:"monospace" }}>{inviteCode}</p>
        </div>
        <button onClick={onCopy} style={{ padding:"8px 20px", background:SAGE, border:"none", borderRadius:20, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginBottom:16 }}>
          📋 코드 복사
        </button>
        <p style={{ fontSize:12, color:MUTED, lineHeight:1.6, marginBottom:20 }}>파트너가 이 코드를 입력하면<br/>자동으로 연동됩니다.</p>
        <button onClick={onClose} style={{ width:"100%", padding:"12px 0", background:WARM, border:`1px solid ${BORDER}`, borderRadius:14, color:MUTED, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
          나중에 연동하기
        </button>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes scaleIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

function DisconnectConfirmPopup({ partnerName, onConfirm, onClose, loading }: {
  partnerName?:string; onConfirm:()=>void; onClose:()=>void; loading:boolean;
}) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:320, background:"#fff", borderRadius:24, padding:"28px 24px", textAlign:"center", animation:"scaleIn 0.2s ease" }}>
        <div style={{ fontSize:44, marginBottom:12 }}>💔</div>
        <p style={{ fontSize:18, fontWeight:800, color:INK, marginBottom:8 }}>커플 연동을 해제할까요?</p>
        <p style={{ fontSize:13, color:MUTED, lineHeight:1.7, marginBottom:6 }}>
          {partnerName ? <><strong style={{ color:ROSE }}>{partnerName}</strong>님과의 연동이 해제됩니다.</> : "파트너와의 연동이 해제됩니다."}
        </p>
        <p style={{ fontSize:12, color:RED, marginBottom:24, lineHeight:1.6 }}>
          ⚠️ 기록 데이터는 유지되지만<br/>서로의 기록을 볼 수 없게 됩니다.
        </p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} disabled={loading} style={{ flex:1, padding:13, background:WARM, border:`1px solid ${BORDER}`, borderRadius:12, color:MUTED, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>취소</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex:2, padding:13, background:loading?"#C0B8B0":RED, border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:loading?"default":"pointer", fontFamily:"inherit" }}>
            {loading ? "해제 중…" : "연동 해제"}
          </button>
        </div>
      </div>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

export default function CouplePage() {
  const router = useRouter();
  const {
    myUid, coupleId, partnerName, partnerProfileImgUrl, startDate,
    initialized, setCoupleId, setStartDate: setAuthStartDate, setAuth,
  } = useAuthStore();

  const [mode,       setMode]       = useState<Mode>("create");
  const [sDate,      setSDate]      = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode,  setInputCode]  = useState("");
  const [status,     setStatus]     = useState<Status>("idle");
  const [statusMsg,  setStatusMsg]  = useState("");

  const [showCodePopup,       setShowCodePopup]       = useState(false);
  const [showSuccessPopup,    setShowSuccessPopup]     = useState(false);
  const [showDisconnectPopup, setShowDisconnectPopup] = useState(false);
  const [disconnecting,       setDisconnecting]       = useState(false);

  useEffect(() => {
    if (status === "idle" || status === "loading") return;
    const t = setTimeout(() => setStatus("idle"), 3000);
    return () => clearTimeout(t);
  }, [status]);

  const showStatus = (s: Status, msg: string) => { setStatus(s); setStatusMsg(msg); };

  const inp: React.CSSProperties = {
    width:"100%", padding:"12px 14px", background:WARM,
    border:`1.5px solid ${BORDER}`, borderRadius:10,
    color:INK, fontSize:14, fontFamily:"inherit",
    outline:"none", boxSizing:"border-box",
  };

  const handleCreate = async () => {
    if (!sDate) { showStatus("empty", "교제 시작일을 선택해주세요."); return; }
    setStatus("loading");
    try {
      const { coupleId: id, inviteCode: code } = await createCouple(myUid, sDate);
      setCoupleId(id);
      setAuthStartDate(sDate);
      setInviteCode(code);
      setStatus("idle");
      setShowCodePopup(true);
    } catch (e: any) {
      showStatus("error", e.message ?? "코드 생성에 실패했어요.");
    }
  };

  const handleJoin = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code)                              { showStatus("empty",   "초대 코드를 입력해주세요."); return; }
    if (!/^TASTE-[A-Z0-9]{6}$/.test(code)) { showStatus("invalid", "코드 형식이 맞지 않아요. (TASTE-XXXXXX)"); return; }
    setStatus("loading");
    try {
      const id = await joinCouple(code, myUid);
      setCoupleId(id);
      setStatus("idle");
      setShowSuccessPopup(true);
    } catch (e: any) {
      const msg = e.message ?? "";
      showStatus(
        msg.includes("유효하지") || msg.includes("사용된") ? "invalid" : "error",
        msg || "연동에 실패했어요. 다시 시도해주세요."
      );
    }
  };

  const handleDisconnect = async () => {
    if (!coupleId) return;
    setDisconnecting(true);
    try {
      await disconnectCouple(myUid, coupleId);
      setAuth({ coupleId: null, partnerName: "", partnerProfileImgUrl: null, startDate: "" });
      setShowDisconnectPopup(false);
      showStatus("success", "커플 연동이 해제됐어요.");
    } catch (e: any) {
      showStatus("error", e.message ?? "연동 해제에 실패했어요.");
      setShowDisconnectPopup(false);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleCodeInput = (v: string) => {
    let clean = v.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (clean.length > 0 && !clean.startsWith("TASTE-")) {
      clean = "TASTE-" + clean.replace(/^TASTE-?/, "");
    }
    if (clean.length > 12) clean = clean.slice(0, 12);
    setInputCode(clean);
    setStatus("idle");
  };

  const isLoading = status === "loading";

  // ★ store 초기화 전 — 로딩 표시 (기존 커플 계정 깜빡임 방지 핵심)
  if (!initialized) {
    return (
      <div style={{ textAlign:"center", padding:"40px 0" }}>
        <div style={{ width:28, height:28, border:"3px solid #F2D5CC", borderTopColor:ROSE, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
        <p style={{ fontSize:13, color:MUTED }}>불러오는 중…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ★ 이미 연동된 상태 — 파트너 정보 + 해제 버튼
  if (coupleId) {
    const dday = startDate ? calcDDay(startDate) : null;
    return (
      <div>
        <h2 style={{ fontSize:20, fontWeight:700, color:INK, marginBottom:6 }}>커플 연동</h2>
        <p style={{ fontSize:13, color:MUTED, marginBottom:20 }}>현재 파트너와 연동 중이에요 💑</p>

        {/* 파트너 정보 카드 */}
        <div style={{ background:WARM, borderRadius:16, padding:16, marginBottom:16, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:SAGE, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:20, fontWeight:700, flexShrink:0 }}>
            {partnerProfileImgUrl
              ? <img src={partnerProfileImgUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : (partnerName ? partnerName[0] : "?")}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:15, fontWeight:700, color:INK, marginBottom:2 }}>
              {partnerName || "파트너"}
            </p>
            <p style={{ fontSize:12, color:MUTED }}>연동된 파트너</p>
            {dday !== null && (
              <p style={{ fontSize:11, color:ROSE, marginTop:4, fontWeight:600 }}>
                💑 함께한 지 D+{dday}일
              </p>
            )}
          </div>
        </div>

        {/* 연동 해제 버튼 */}
        <button
          onClick={() => setShowDisconnectPopup(true)}
          style={{ width:"100%", padding:14, background:"transparent", border:`1.5px solid ${RED}`, borderRadius:12, color:RED, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          💔 커플 연동 해제하기
        </button>
        <p style={{ fontSize:11, color:MUTED, textAlign:"center", marginTop:10, lineHeight:1.6 }}>
          연동 해제 시 서로의 기록을 볼 수 없게 됩니다.<br/>기록 데이터는 삭제되지 않아요.
        </p>

        <StatusToast status={status} msg={statusMsg} />

        {showDisconnectPopup && (
          <DisconnectConfirmPopup
            partnerName={partnerName || undefined}
            onConfirm={handleDisconnect}
            onClose={() => setShowDisconnectPopup(false)}
            loading={disconnecting}
          />
        )}
      </div>
    );
  }

  // 미연동 상태 — 코드 만들기 / 입력하기
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:700, color:INK, marginBottom:6 }}>커플 연동</h2>
      <p style={{ fontSize:13, color:MUTED, marginBottom:24 }}>파트너와 연동해야 함께 기록을 볼 수 있어요 💑</p>

      <div style={{ display:"flex", background:WARM, borderRadius:12, padding:3, border:`1px solid ${BORDER}`, marginBottom:24 }}>
        {(["create","join"] as const).map(m => (
          <button key={m}
            onClick={() => { setMode(m); setStatus("idle"); setInviteCode(""); setInputCode(""); }}
            style={{ flex:1, padding:10, border:"none", borderRadius:9, background:mode===m?"#fff":"transparent", color:mode===m?ROSE:MUTED, fontSize:14, fontWeight:mode===m?700:400, cursor:"pointer", fontFamily:"inherit", boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>
            {m === "create" ? "코드 만들기" : "코드 입력하기"}
          </button>
        ))}
      </div>

      {mode === "create" && (
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:MUTED, display:"block", marginBottom:8 }}>교제 시작일 (D-Day 기준)</label>
          <input
            type="date" value={sDate}
            onChange={e => { setSDate(e.target.value); setStatus("idle"); }}
            max={new Date().toISOString().slice(0,10)}
            style={{ ...inp, marginBottom:16, border:`1.5px solid ${status==="empty"?RED:BORDER}` }}
          />
          <button onClick={handleCreate} disabled={isLoading}
            style={{ width:"100%", padding:13, background:isLoading?"#C0B8B0":ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:isLoading?"default":"pointer", fontFamily:"inherit" }}>
            {isLoading ? "생성 중…" : "✨ 초대 코드 만들기"}
          </button>
        </div>
      )}

      {mode === "join" && (
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:MUTED, display:"block", marginBottom:8 }}>파트너의 초대 코드 입력</label>
          <div style={{ position:"relative", marginBottom:16 }}>
            <input
              placeholder="TASTE-XXXXXX" value={inputCode}
              onChange={e => handleCodeInput(e.target.value)}
              style={{ ...inp, letterSpacing:3, fontWeight:600, textAlign:"center", fontSize:16,
                border:`1.5px solid ${status==="empty"||status==="invalid"?RED:status==="success"?SAGE:BORDER}` }}
            />
            {inputCode.length > 0 && (
              <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:14 }}>
                {/^TASTE-[A-Z0-9]{6}$/.test(inputCode) ? "✅" : "…"}
              </div>
            )}
          </div>
          <p style={{ fontSize:11, color:MUTED, marginBottom:16, textAlign:"center" }}>형식: TASTE-XXXXXX (대문자+숫자 6자리)</p>
          <button onClick={handleJoin} disabled={isLoading}
            style={{ width:"100%", padding:13, background:isLoading?"#C0B8B0":ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:isLoading?"default":"pointer", fontFamily:"inherit" }}>
            {isLoading ? "연동 중…" : "💑 커플 연동하기"}
          </button>
        </div>
      )}

      <StatusToast status={status} msg={statusMsg} />

      {showCodePopup && (
        <CodeCreatedPopup
          inviteCode={inviteCode}
          onCopy={() => { navigator.clipboard.writeText(inviteCode); showStatus("success", "클립보드에 복사됐어요!"); }}
          onClose={() => { setShowCodePopup(false); router.push("/"); }}
        />
      )}

      {showSuccessPopup && (
        <CoupleSuccessPopup
          partnerName={partnerName || undefined}
          onStart={() => { setShowSuccessPopup(false); router.push("/"); }}
        />
      )}
    </div>
  );
}
