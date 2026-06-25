// ============================================================
//  couple/page.tsx  적용 경로: src/app/(auth)/couple/page.tsx
//
//  수정사항:
//    ★ useSearchParams()로 ?mode=join URL 파라미터 읽어 초기 탭 설정
//    ★ 미연동 상태 상단에 "← 홈으로" 뒤로가기 버튼 추가
//    ★ 파트너 이름 말줄임 — 파트너 정보 카드 및 팝업에서
//      10자 초과 시 "…" 처리 (긴 구글 계정 이름 레이아웃 방지)
//    ★ 연동 해제 시 couples 문서 삭제가 실패해도 더 이상 조용히 넘어가지 않음
//      → 미연동 화면에 "정리 안 된 연동 코드" 배너 + 재시도 버튼 추가
//      → 코드 생성/입력 시도 직전에도 자동(best-effort)으로 한 번 더 정리 시도
//
//  버그 수정 (2026-06-26):
//    ★ 연동 해제 직후 orphan 배너가 잘못 뜨는 버그 수정
//      원인: handleDisconnect → setAuth({ coupleId: null }) → useEffect 재실행
//            → 이 시점 deleteDoc이 Firestore에 미반영 → hasOrphanCouples=true 오감지
//      해결: disconnectingRef(useRef)로 해제 진행 중 orphan 체크 차단
//            + useEffect 내 800ms 딜레이로 Firestore 반영 시간 확보
//            + 해제 성공 시 setShowCleanupBanner(false) 명시 호출
//            + finally에서 1000ms 후 disconnectingRef 해제
//    ★ inp 타입 React.CSSProperties → CSSProperties (규칙 10 준수)
// ============================================================
"use client";

import { useState, useEffect, useRef, Suspense, type CSSProperties } from "react";
import { useRouter, useSearchParams }      from "next/navigation";
import {
  createCouple, joinCouple, disconnectCouple,
  hasOrphanCouples, retryCleanupOrphanCouples,
} from "@/lib/firebase/auth";
import { useAuthStore }                    from "@/store/authStore";
import { calcDDay }                        from "@/lib/utils/date";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const SAGE    = "#6B9E7E";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const RED     = "#EF4444";
const AMBER        = "#856404";
const AMBER_BG     = "#FFF3CD";
const AMBER_BORDER = "#FFE69C";

function tn(name: string, max = 10): string {
  return name.length > max ? name.slice(0, max) + "…" : name;
}

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
  const displayName = partnerName ? tn(partnerName, 12) : null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24, animation:"fadeIn 0.2s ease" }}>
      <div style={{ width:"100%", maxWidth:320, background:"#fff", borderRadius:24, padding:"32px 24px", textAlign:"center", animation:"scaleIn 0.25s ease" }}>
        <div style={{ fontSize:60, marginBottom:4, animation:"heartBeat 0.6s ease 0.2s both" }}>💑</div>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:20 }}>
          {["❤️","🎉","✨"].map((e,i)=><span key={i} style={{ fontSize:22, animation:`popIn 0.4s ease ${0.3+i*0.1}s both` }}>{e}</span>)}
        </div>
        <p style={{ fontSize:22, fontWeight:800, color:INK, marginBottom:8 }}>연동 완료!</p>
        <p style={{ fontSize:14, color:MUTED, lineHeight:1.7, marginBottom:24 }}>
          {displayName
            ? <><strong style={{ color:ROSE }}>{displayName}</strong>님과 연동됐어요.<br/>이제 함께 맛집을 기록해보세요 🍽️</>
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
  const displayName = partnerName ? tn(partnerName, 12) : null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:320, background:"#fff", borderRadius:24, padding:"28px 24px", textAlign:"center", animation:"scaleIn 0.2s ease" }}>
        <div style={{ fontSize:44, marginBottom:12 }}>💔</div>
        <p style={{ fontSize:18, fontWeight:800, color:INK, marginBottom:8 }}>커플 연동을 해제할까요?</p>
        <p style={{ fontSize:13, color:MUTED, lineHeight:1.7, marginBottom:6 }}>
          {displayName ? <><strong style={{ color:ROSE }}>{displayName}</strong>님과의 연동이 해제됩니다.</> : "파트너와의 연동이 해제됩니다."}
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

function OrphanCleanupBanner({ cleaning, onRetry }: { cleaning: boolean; onRetry: () => void }) {
  return (
    <div style={{ background:AMBER_BG, border:`1px solid ${AMBER_BORDER}`, borderRadius:12, padding:"12px 14px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
      <p style={{ fontSize:12, color:AMBER, lineHeight:1.5 }}>
        ⚠️ 이전 연동 해제가 완전히 정리되지 않았어요.
      </p>
      <button onClick={onRetry} disabled={cleaning} className="tap" style={{ padding:"6px 12px", background:"#fff", border:`1px solid ${AMBER}`, borderRadius:8, color:AMBER, fontSize:12, fontWeight:700, cursor:cleaning?"default":"pointer", fontFamily:"inherit", whiteSpace:"nowrap", flexShrink:0 }}>
        {cleaning ? "정리 중…" : "다시 정리"}
      </button>
    </div>
  );
}

// ★ useSearchParams를 사용하는 내부 컴포넌트 — Suspense로 감싸야 함
function CouplePageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const {
    myUid, coupleId, partnerName, partnerProfileImgUrl, startDate,
    initialized, setCoupleId, setStartDate: setAuthStartDate, setAuth,
  } = useAuthStore();

  // ★ URL ?mode=join 파라미터로 초기 탭 결정
  const initialMode = searchParams.get("mode") === "join" ? "join" : "create";
  const [mode,       setMode]       = useState<Mode>(initialMode);
  const [sDate,      setSDate]      = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode,  setInputCode]  = useState("");
  const [status,     setStatus]     = useState<Status>("idle");
  const [statusMsg,  setStatusMsg]  = useState("");

  const [showCodePopup,       setShowCodePopup]       = useState(false);
  const [showSuccessPopup,    setShowSuccessPopup]     = useState(false);
  const [showDisconnectPopup, setShowDisconnectPopup] = useState(false);
  const [disconnecting,       setDisconnecting]       = useState(false);

  const [showCleanupBanner, setShowCleanupBanner] = useState(false);
  const [cleaning,          setCleaning]          = useState(false);

  // ★ 해제 진행 중 플래그 — ref로 관리해야 useEffect 클로저에서 최신값을 읽을 수 있음
  const disconnectingRef = useRef(false);

  useEffect(() => {
    if (status === "idle" || status === "loading") return;
    const t = setTimeout(() => setStatus("idle"), 3000);
    return () => clearTimeout(t);
  }, [status]);

  useEffect(() => {
    // ★ 초기화 미완료 / 이미 연동 중 / myUid 없는 경우 체크 안 함
    if (!initialized || coupleId || !myUid) return;
    // ★ 핵심 수정: disconnectCouple 진행 중 / 직후에는 orphan 체크를 하지 않음.
    //   handleDisconnect에서 setAuth({ coupleId: null })을 호출하면 이 effect가
    //   재실행되는데, 이 시점엔 deleteDoc이 아직 Firestore에 반영되지 않아
    //   orphan으로 오감지해 배너가 잘못 뜨는 버그를 방지함.
    //   disconnectingRef가 해제되고 800ms 후에 체크해 반영 시간을 확보함.
    const t = setTimeout(() => {
      if (disconnectingRef.current) return;
      hasOrphanCouples(myUid)
        .then(setShowCleanupBanner)
        .catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [initialized, coupleId, myUid]);

  const showStatus = (s: Status, msg: string) => { setStatus(s); setStatusMsg(msg); };

  const inp: CSSProperties = {
    width:"100%", padding:"12px 14px", background:WARM,
    border:`1.5px solid ${BORDER}`, borderRadius:10,
    color:INK, fontSize:14, fontFamily:"inherit",
    outline:"none", boxSizing:"border-box",
  };

  const handleRetryCleanup = async () => {
    if (!myUid) return;
    setCleaning(true);
    try {
      const { cleaned, stillFailed } = await retryCleanupOrphanCouples(myUid);
      if (stillFailed.length === 0) {
        setShowCleanupBanner(false);
        showStatus("success", cleaned > 0 ? "정리가 완료됐어요. 이제 다시 연동할 수 있어요." : "정리할 항목이 없어요.");
      } else {
        showStatus("error", "아직 정리가 안 됐어요. 잠시 후 다시 시도해주세요.");
      }
    } catch (e: any) {
      showStatus("error", e.message ?? "정리에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setCleaning(false);
    }
  };

  const handleCreate = async () => {
    if (!sDate) { showStatus("empty", "교제 시작일을 선택해주세요."); return; }
    setStatus("loading");
    await retryCleanupOrphanCouples(myUid).catch(() => {});
    try {
      const { inviteCode: code } = await createCouple(myUid, sDate);
      // ★ setCoupleId를 여기서 즉시 호출하면 coupleId가 생겨 "연동된 상태" 분기로
      //   전환되면서 CodeCreatedPopup 팝업과 화면이 겹치는 버그 발생.
      //   → 팝업을 먼저 열고, 팝업의 "나중에 연동하기" 버튼에서 페이지를 이동.
      //   → authStore의 onSnapshot이 Firestore 변경을 감지해 자동으로 coupleId를
      //     업데이트하므로 별도로 setCoupleId를 호출할 필요 없음. (handleJoin과 동일)
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
    await retryCleanupOrphanCouples(myUid).catch(() => {});
    try {
      const id = await joinCouple(code, myUid);
      // ★ setCoupleId를 여기서 즉시 호출하면 coupleId가 생겨 "연동된 상태" 분기로
      //   전환되면서 showSuccessPopup 팝업과 화면이 겹치는 버그 발생.
      //   → 팝업을 먼저 열고, 팝업의 "맛지도 시작하기" 버튼에서 페이지를 이동.
      //   → authStore의 onSnapshot이 Firestore 변경을 감지해 자동으로 coupleId를
      //     업데이트하므로 별도로 setCoupleId를 호출할 필요 없음.
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
    disconnectingRef.current = true;  // ★ orphan 체크 차단 시작
    try {
      const { success, staleCoupleIds } = await disconnectCouple(myUid, coupleId);
      // ★ store 즉시 초기화 (onSnapshot 반응 전에 UI가 먼저 정리되도록)
      setAuth({ coupleId: null, partnerName: "", partnerProfileImgUrl: null, startDate: "" });
      // ★ 해제 후 날짜 입력값도 초기화 — 직전 sDate가 남아 즉시 재생성되는 버그 방지
      setSDate("");
      setInviteCode("");
      setInputCode("");
      setMode("create");
      setShowDisconnectPopup(false);
      if (success) {
        // ★ 핵심 수정: 성공 시 배너를 명시적으로 숨김
        //   (useEffect가 coupleId=null 감지 후 orphan 체크를 800ms 후에 하도록
        //   딜레이를 줬지만, disconnectingRef가 아직 true인 동안은 체크를 막음.
        //   여기서 false로 리셋하면 이후 800ms 후 타이머가 정상 체크를 수행함)
        setShowCleanupBanner(false);
        showStatus("success", "커플 연동이 해제됐어요.");
      } else {
        setShowCleanupBanner(true);
        showStatus("success", `연동은 해제됐어요. (정리가 덜 됐어요 — ${staleCoupleIds.length}건, 아래에서 다시 시도할 수 있어요)`);
      }
    } catch (e: any) {
      showStatus("error", e.message ?? "연동 해제에 실패했어요.");
      setShowDisconnectPopup(false);
    } finally {
      setDisconnecting(false);
      // ★ Firestore deleteDoc 반영을 기다린 후 ref 해제 (800ms는 effect 딜레이와 동일)
      setTimeout(() => { disconnectingRef.current = false; }, 1000);
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

  if (!initialized) {
    return (
      <div style={{ textAlign:"center", padding:"40px 0" }}>
        <div style={{ width:28, height:28, border:"3px solid #F2D5CC", borderTopColor:ROSE, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
        <p style={{ fontSize:13, color:MUTED }}>불러오는 중…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ★ 연동 완료 팝업이 열려있는 동안은 연동된 화면으로 전환하지 않음
  //   (joinCouple 완료 → setCoupleId → coupleId 생겨 분기 변경 타이밍 충돌 방지)
  if (showSuccessPopup) {
    return (
      <>
        <div style={{ textAlign:"center", padding:"80px 24px", color:MUTED }}>
          <div style={{ fontSize:52, marginBottom:12 }}>💑</div>
          <p style={{ fontSize:16, fontWeight:700, color:INK }}>연동 완료!</p>
        </div>
        <CoupleSuccessPopup
          partnerName={partnerName || undefined}
          onStart={() => { setShowSuccessPopup(false); window.location.href = "/"; }}
        />
      </>
    );
  }

  // 이미 연동된 상태 — 파트너 정보 + 해제 버튼
  if (coupleId) {
    const dday = startDate ? calcDDay(startDate) : null;
    const displayPartnerName = partnerName ? tn(partnerName, 12) : "파트너";
    return (
      <div>
        <button onClick={() => { window.location.href = "/"; }} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:MUTED, fontSize:13, cursor:"pointer", fontFamily:"inherit", padding:"0 0 16px 0" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          홈으로
        </button>
        <h2 style={{ fontSize:20, fontWeight:700, color:INK, marginBottom:6 }}>커플 연동</h2>
        <p style={{ fontSize:13, color:MUTED, marginBottom:20 }}>현재 파트너와 연동 중이에요 💑</p>

        <div style={{ background:WARM, borderRadius:16, padding:16, marginBottom:16, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:SAGE, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:20, fontWeight:700, flexShrink:0 }}>
            {partnerProfileImgUrl
              ? <img src={partnerProfileImgUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : (partnerName ? partnerName[0] : "?")}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:15, fontWeight:700, color:INK, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {displayPartnerName}
            </p>
            <p style={{ fontSize:12, color:MUTED }}>연동된 파트너</p>
            {dday !== null && (
              <p style={{ fontSize:11, color:ROSE, marginTop:4, fontWeight:600 }}>
                💑 함께한 지 D+{dday}일
              </p>
            )}
          </div>
        </div>

        <button onClick={() => setShowDisconnectPopup(true)} style={{ width:"100%", padding:14, background:"transparent", border:`1.5px solid ${RED}`, borderRadius:12, color:RED, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
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
      {/* ★ 뒤로가기 버튼 */}
      <button onClick={() => { window.location.href = "/"; }} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:MUTED, fontSize:13, cursor:"pointer", fontFamily:"inherit", padding:"0 0 16px 0" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        홈으로
      </button>

      <h2 style={{ fontSize:20, fontWeight:700, color:INK, marginBottom:6 }}>커플 연동</h2>
      <p style={{ fontSize:13, color:MUTED, marginBottom:20 }}>파트너와 연동해야 함께 기록을 볼 수 있어요 💑</p>

      {showCleanupBanner && (
        <OrphanCleanupBanner cleaning={cleaning} onRetry={handleRetryCleanup} />
      )}

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
          <button onClick={handleCreate} className="tap" disabled={isLoading}
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
              style={{ ...inp, letterSpacing:3, fontWeight:600, textAlign:"center", fontSize:16, border:`1.5px solid ${status==="empty"||status==="invalid"?RED:status==="success"?SAGE:BORDER}` }}
            />
            {inputCode.length > 0 && (
              <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:14 }}>
                {/^TASTE-[A-Z0-9]{6}$/.test(inputCode) ? "✅" : "…"}
              </div>
            )}
          </div>
          <p style={{ fontSize:11, color:MUTED, marginBottom:16, textAlign:"center" }}>형식: TASTE-XXXXXX (대문자+숫자 6자리)</p>
          <button onClick={handleJoin} className="tap" disabled={isLoading}
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
          onClose={() => { setShowCodePopup(false); window.location.href = "/"; }}
        />
      )}
    </div>
  );
}

// ★ useSearchParams는 반드시 Suspense로 감싸야 빌드 오류 없음
export default function CouplePage() {
  return (
    <Suspense fallback={null}>
      <CouplePageInner />
    </Suspense>
  );
}
