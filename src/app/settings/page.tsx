// src/app/settings/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter }                   from "next/navigation";
import { useAuthStore }                from "@/store/authStore";
import { calcDDay }                    from "@/lib/utils/date";
import { uploadImage }                 from "@/lib/firebase/storage";
import { signOut }                     from "firebase/auth";
import { auth }                        from "@/lib/firebase/config";
import { doc, updateDoc, onSnapshot }  from "firebase/firestore";
import { db }                          from "@/lib/firebase/config";
import { BatchGeocode }                from "@/components/common/BatchGeocode";
import { InvitePopup } from "@/components/settings/InvitePopup";
import {
  loadNotifSettings, saveNotifSettings,
  requestNotificationPermission,
  type NotificationSettings,
} from "@/lib/firebase/notifications";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const SAGE    = "#6B9E7E";
const PURPLE  = "#7B6BAE";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const CREAM   = "#F0EBE3";
const RED     = "#EF4444";

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_]{2,10}$/;

interface AppConfig { appVersion: string; supportEmail: string; notice: string; }

function SectionLabel({ title }: { title: string }) {
  return <p style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:1.2, textTransform:"uppercase", padding:"20px 20px 8px" }}>{title}</p>;
}

function Row({ icon, label, value, sub, onClick, danger=false, rightEl }: {
  icon:string; label:string; value?:string; sub?:string;
  onClick?:()=>void; danger?:boolean; rightEl?:React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"13px 20px", background:"#fff", border:"none", borderBottom:`1px solid ${BORDER}`, cursor:onClick?"pointer":"default", fontFamily:"inherit", textAlign:"left" }}>
      <div style={{ width:36, height:36, borderRadius:10, background:danger?"#FFF5F5":CREAM, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:500, color:danger?RED:INK }}>{label}</p>
        {(value||sub) && <p style={{ fontSize:12, color:MUTED, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}{sub?` · ${sub}`:""}</p>}
      </div>
      {rightEl ?? (onClick && <span style={{ fontSize:18, color:"#C0B8B0", flexShrink:0 }}>›</span>)}
    </button>
  );
}

function Toggle({ on, onToggle }: { on:boolean; onToggle:()=>void }) {
  return (
    <div onClick={(e)=>{ e.stopPropagation(); onToggle(); }}
      style={{ width:44, height:26, borderRadius:13, background:on?ROSE:"#E2DDD8", cursor:"pointer", position:"relative", transition:"background 0.25s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:3, left:on?21:3, width:20, height:20, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"left 0.25s" }} />
    </div>
  );
}

function Popup({ onClose, children }: { onClose:()=>void; children:React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={(e)=>e.stopPropagation()} style={{ width:"100%", maxWidth:320, background:"#fff", borderRadius:20, padding:24, animation:"scaleIn 0.18s ease both" }}>{children}</div>
    </div>
  );
}

function EditNamePopup({ current, onSave, onClose }: { current:string; onSave:(v:string)=>void; onClose:()=>void }) {
  const [val, setVal] = useState(current);
  const [err, setErr] = useState("");
  const validate = (v: string) => {
    if (!v.trim()) return "닉네임을 입력해주세요.";
    if (!NICKNAME_REGEX.test(v.trim())) return "2~10자, 한글/영문/숫자/밑줄만 사용 가능합니다.";
    return "";
  };
  const handleSave = () => {
    const e = validate(val);
    if (e) { setErr(e); return; }
    onSave(val.trim()); onClose();
  };
  return (
    <Popup onClose={onClose}>
      <p style={{ fontSize:16, fontWeight:700, color:INK, marginBottom:16 }}>닉네임 변경</p>
      <input value={val} onChange={(e)=>{ setVal(e.target.value); setErr(""); }} maxLength={10} autoFocus
        style={{ width:"100%", padding:"12px 14px", background:WARM, border:`1.5px solid ${err?RED:BORDER}`, borderRadius:10, fontSize:14, color:INK, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:4 }} />
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        {err ? <p style={{ fontSize:11, color:RED }}>{err}</p> : <span />}
        <p style={{ fontSize:11, color:MUTED }}>{val.length}/10</p>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:12, background:WARM, border:`1px solid ${BORDER}`, borderRadius:12, color:MUTED, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>취소</button>
        <button onClick={handleSave} style={{ flex:2, padding:12, background:ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>저장</button>
      </div>
    </Popup>
  );
}

function EditDatePopup({ current, onSave, onClose }: { current:string; onSave:(v:string)=>void; onClose:()=>void }) {
  const [val, setVal] = useState(current);
  return (
    <Popup onClose={onClose}>
      <p style={{ fontSize:16, fontWeight:700, color:INK, marginBottom:4 }}>교제 시작일 변경</p>
      <p style={{ fontSize:12, color:MUTED, marginBottom:16 }}>D-Day 계산 기준일이 바뀝니다</p>
      <input type="date" value={val} onChange={(e)=>setVal(e.target.value)} max={new Date().toISOString().slice(0,10)}
        style={{ width:"100%", padding:"12px 14px", background:WARM, border:`1px solid ${BORDER}`, borderRadius:10, fontSize:14, color:INK, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:16 }} />
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:12, background:WARM, border:`1px solid ${BORDER}`, borderRadius:12, color:MUTED, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>취소</button>
        <button onClick={()=>{ if(val){onSave(val);onClose();} }} style={{ flex:2, padding:12, background:ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>저장</button>
      </div>
    </Popup>
  );
}

// ── ★ 완전히 교체된 InvitePopup
// 연동 중: 파트너 정보 표시 + 연동 해제 버튼
// 미연동:  내 코드 보기 / 코드 입력하기
// function InvitePopup({ onClose }: { onClose:()=>void }) {
//   const {
//     coupleId, myUid, partnerName, partnerProfileImgUrl, startDate,
//     setCoupleId: setStoreCoupleId, setAuth,
//   } = useAuthStore();

//   const [mode,        setMode]        = useState<"show"|"enter">("show");
//   const [myCode,      setMyCode]      = useState("불러오는 중...");
//   const [copied,      setCopied]      = useState(false);
//   const [code,        setCode]        = useState("");
//   const [joinStatus,  setJoinStatus]  = useState<"idle"|"loading"|"success"|"self"|"notfound"|"error">("idle");
//   const [joinMsg,     setJoinMsg]     = useState("");
//   const [disconnecting, setDisconnecting] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   // 내 초대 코드 불러오기
//   useEffect(() => {
//     if (!coupleId) { setMyCode("미연동"); return; }
//     import("@/lib/firebase/auth").then(({ fetchCouple }) => {
//       fetchCouple(coupleId)
//         .then(couple => setMyCode(couple?.inviteCode ?? "코드 없음"))
//         .catch(() => setMyCode("오류"));
//     });
//   }, [coupleId]);

//   // 코드 입력 연동
//   const handleJoin = async () => {
//     const trimmed = code.trim().toUpperCase();
//     if (!trimmed) { setJoinStatus("error"); setJoinMsg("코드를 입력해주세요."); return; }
//     if (!/^TASTE-[A-Z0-9]{6}$/.test(trimmed)) { setJoinStatus("error"); setJoinMsg("코드 형식이 맞지 않아요. (TASTE-XXXXXX)"); return; }
//     if (myCode !== "불러오는 중..." && myCode !== "미연동" && trimmed === myCode) {
//       setJoinStatus("self"); setJoinMsg("😅 본인이 만든 코드예요. 파트너의 코드를 입력해주세요."); return;
//     }
//     setJoinStatus("loading"); setJoinMsg("");
//     try {
//       const { joinCouple, fetchCouple } = await import("@/lib/firebase/auth");
//       const { getDoc, doc } = await import("firebase/firestore");
//       const { db } = await import("@/lib/firebase/config");

//       const newCoupleId = await joinCouple(trimmed, myUid);

//       // ★ 연동 직후 파트너 정보를 Firestore에서 가져와 store 즉시 업데이트
//       try {
//         const coupleData = await fetchCouple(newCoupleId);
//         if (coupleData) {
//           const partnerUid = coupleData.user1Uid === myUid
//             ? coupleData.user2Uid
//             : coupleData.user1Uid;
//           const startDate = coupleData.startDate ?? "";

//           let newPartnerName = "";
//           let newPartnerImgUrl: string | null = null;

//           if (partnerUid) {
//             const partnerSnap = await getDoc(doc(db, "users", partnerUid));
//             if (partnerSnap.exists()) {
//               newPartnerName   = partnerSnap.data().name           ?? "";
//               newPartnerImgUrl = partnerSnap.data().profileImgUrl  ?? null;
//             }
//           }

//           setAuth({
//             coupleId:             newCoupleId,
//             partnerName:          newPartnerName,
//             partnerProfileImgUrl: newPartnerImgUrl,
//             startDate,
//           });
//         }
//       } catch {
//         // 파트너 정보 조회 실패 시 coupleId만 업데이트
//         setStoreCoupleId(newCoupleId);
//       }

//       setJoinStatus("success"); setJoinMsg("💑 커플 연동 성공!");
//       setTimeout(() => onClose(), 1500);
//     } catch (e: any) {
//       const msg = e.message ?? "";
//       if (msg.includes("사용된")) { setJoinStatus("notfound"); setJoinMsg("❌ 이미 사용된 코드예요."); }
//       else if (msg.includes("유효하지") || msg.includes("없")) { setJoinStatus("notfound"); setJoinMsg("❌ 없는 코드예요. 다시 확인해주세요."); }
//       else { setJoinStatus("error"); setJoinMsg("❌ 연동 실패. 다시 시도해주세요."); }
//     }
//   };

//   // 연동 해제
//   const handleDisconnect = async () => {
//     if (!coupleId) return;
//     setDisconnecting(true);
//     try {
//       const { disconnectCouple } = await import("@/lib/firebase/auth");
//       await disconnectCouple(myUid, coupleId);
//       setAuth({ coupleId: null, partnerName: "", partnerProfileImgUrl: null, startDate: "" });
//       setShowConfirm(false);
//       onClose();
//     } catch (e: any) {
//       console.error("연동 해제 오류:", e);
//     } finally {
//       setDisconnecting(false);
//     }
//   };

//   const ss = {
//     idle:     { bg:"transparent", color:"transparent" },
//     loading:  { bg:WARM,          color:MUTED },
//     success:  { bg:"#D1F0E0",     color:"#0A5C36" },
//     self:     { bg:"#FFF3CD",     color:"#856404" },
//     notfound: { bg:"#F8D7DA",     color:"#842029" },
//     error:    { bg:"#FFF3CD",     color:"#856404" },
//   }[joinStatus];

//   // ── 연동 해제 확인 팝업
//   if (showConfirm) {
//     return (
//       <div onClick={()=>setShowConfirm(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:900, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
//         <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:320, background:"#fff", borderRadius:20, padding:24, textAlign:"center" }}>
//           <div style={{ fontSize:40, marginBottom:12 }}>💔</div>
//           <p style={{ fontSize:16, fontWeight:700, color:INK, marginBottom:8 }}>커플 연동을 해제할까요?</p>
//           <p style={{ fontSize:13, color:MUTED, lineHeight:1.6, marginBottom:6 }}>
//             {partnerName ? <><strong style={{ color:ROSE }}>{partnerName}</strong>님과의 연동이 해제됩니다.</> : "파트너와의 연동이 해제됩니다."}
//           </p>
//           <p style={{ fontSize:12, color:RED, marginBottom:20, lineHeight:1.6 }}>
//             ⚠️ 기록 데이터는 유지되지만<br/>서로의 기록을 볼 수 없게 됩니다.
//           </p>
//           <div style={{ display:"flex", gap:10 }}>
//             <button onClick={()=>setShowConfirm(false)} disabled={disconnecting}
//               style={{ flex:1, padding:12, background:WARM, border:`1px solid ${BORDER}`, borderRadius:12, color:MUTED, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>취소</button>
//             <button onClick={handleDisconnect} disabled={disconnecting}
//               style={{ flex:2, padding:12, background:disconnecting?"#C0B8B0":RED, border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:disconnecting?"default":"pointer", fontFamily:"inherit" }}>
//               {disconnecting ? "해제 중…" : "연동 해제"}
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
//       <div onClick={(e)=>e.stopPropagation()} style={{ width:"100%", maxWidth:360, background:"#fff", borderRadius:20, padding:24 }}>

//         {/* ── 연동 중인 경우: 파트너 정보 + 해제 버튼 */}
//         {coupleId && partnerName ? (
//           <>
//             <p style={{ fontSize:16, fontWeight:700, color:INK, marginBottom:20 }}>커플 연동 정보</p>

//             {/* 파트너 프로필 카드 */}
//             <div style={{ background:WARM, borderRadius:16, padding:"16px", marginBottom:16, display:"flex", alignItems:"center", gap:14 }}>
//               <div style={{ width:52, height:52, borderRadius:"50%", background:SAGE, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:20, fontWeight:700, flexShrink:0 }}>
//                 {partnerProfileImgUrl
//                   ? <img src={partnerProfileImgUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
//                   : partnerName[0]}
//               </div>
//               <div style={{ flex:1 }}>
//                 <p style={{ fontSize:15, fontWeight:700, color:INK, marginBottom:2 }}>{partnerName}</p>
//                 <p style={{ fontSize:12, color:MUTED }}>연동된 파트너</p>
//                 {startDate && (
//                   <p style={{ fontSize:11, color:ROSE, marginTop:4, fontWeight:600 }}>
//                     💑 함께한 지 D+{calcDDay(startDate)}일
//                   </p>
//                 )}
//               </div>
//             </div>

//             {/* 내 초대 코드 */}
//             <div style={{ background:"#fff", border:`1px solid ${BORDER}`, borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
//               <p style={{ fontSize:11, color:MUTED, marginBottom:6 }}>내 초대 코드</p>
//               <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
//                 <p style={{ fontSize:16, fontWeight:800, color:ROSE, letterSpacing:3, fontFamily:"monospace" }}>{myCode}</p>
//                 <button onClick={()=>{ navigator.clipboard.writeText(myCode); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
//                   style={{ padding:"5px 12px", background:copied?SAGE:ROSE_LT, border:"none", borderRadius:20, color:copied?"#fff":ROSE, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", flexShrink:0, transition:"all 0.2s" }}>
//                   {copied ? "✅ 복사됨" : "📋 복사"}
//                 </button>
//               </div>
//             </div>

//             {/* 연동 해제 버튼 */}
//             <button onClick={()=>setShowConfirm(true)}
//               style={{ width:"100%", padding:"12px 0", background:"transparent", border:`1.5px solid ${RED}`, borderRadius:12, color:RED, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
//               💔 커플 연동 해제하기
//             </button>
//           </>
//         ) : (
//           /* ── 미연동 또는 파트너 미연결: 코드 생성/입력 */
//           <>
//             <p style={{ fontSize:16, fontWeight:700, color:INK, marginBottom:20 }}>커플 연동</p>
//             <div style={{ display:"flex", background:WARM, borderRadius:12, padding:3, border:`1px solid ${BORDER}`, marginBottom:20 }}>
//               {(["show","enter"] as const).map(m=>(
//                 <button key={m} onClick={()=>{ setMode(m); setJoinStatus("idle"); }}
//                   style={{ flex:1, padding:9, border:"none", borderRadius:9, background:mode===m?"#fff":"transparent", color:mode===m?ROSE:MUTED, fontSize:13, fontWeight:mode===m?700:400, cursor:"pointer", fontFamily:"inherit" }}>
//                   {m==="show" ? "내 코드 보기" : "코드 입력하기"}
//                 </button>
//               ))}
//             </div>

//             {mode==="show" ? (
//               <div style={{ textAlign:"center" }}>
//                 <p style={{ fontSize:12, color:MUTED, marginBottom:14 }}>파트너에게 코드를 전달하세요</p>
//                 <div style={{ background:ROSE_LT, borderRadius:14, padding:"18px 24px", marginBottom:14 }}>
//                   <p style={{ fontSize:24, fontWeight:800, color:ROSE, letterSpacing:5, fontFamily:"monospace" }}>{myCode}</p>
//                 </div>
//                 <button onClick={()=>{ navigator.clipboard.writeText(myCode); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
//                   style={{ padding:"8px 20px", background:copied?SAGE:ROSE, border:"none", borderRadius:20, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"background 0.2s" }}>
//                   {copied ? "✅ 복사됨" : "📋 코드 복사"}
//                 </button>
//                 {myCode === "미연동" && (
//                   <p style={{ fontSize:11, color:MUTED, marginTop:12, lineHeight:1.6 }}>
//                     아직 초대 코드가 없어요.<br/>커플 연동 페이지에서 코드를 만들어보세요.
//                   </p>
//                 )}
//               </div>
//             ) : (
//               <div>
//                 <input placeholder="TASTE-XXXXXX" value={code}
//                   onChange={(e)=>{ setCode(e.target.value.toUpperCase()); setJoinStatus("idle"); }}
//                   style={{ width:"100%", padding:"12px 14px", background:WARM,
//                     border:`1.5px solid ${joinStatus==="notfound"||joinStatus==="error"?RED:joinStatus==="success"?SAGE:joinStatus==="self"?"#F59E0B":BORDER}`,
//                     borderRadius:10, letterSpacing:3, fontWeight:600, textAlign:"center", fontSize:16, color:INK, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:10 }} />
//                 {joinStatus!=="idle" && (
//                   <div style={{ padding:"10px 14px", borderRadius:10, background:ss.bg, marginBottom:12, textAlign:"center" }}>
//                     <p style={{ fontSize:13, fontWeight:600, color:ss.color }}>{joinMsg}</p>
//                   </div>
//                 )}
//                 <p style={{ fontSize:11, color:MUTED, textAlign:"center", marginBottom:16 }}>형식: TASTE-XXXXXX</p>
//                 <button onClick={handleJoin} disabled={joinStatus==="loading"||joinStatus==="success"}
//                   style={{ width:"100%", padding:13, background:joinStatus==="loading"?"#C0B8B0":joinStatus==="success"?SAGE:ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
//                   {joinStatus==="loading" ? "연동 중…" : joinStatus==="success" ? "연동 완료 ✅" : "💑 커플 연동하기"}
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

function ConfirmPopup({ emoji, title, desc, sub, confirmLabel, danger=false, onConfirm, onClose }: {
  emoji:string; title:string; desc:string; sub?:string; confirmLabel:string; danger?:boolean; onConfirm:()=>void; onClose:()=>void;
}) {
  return (
    <Popup onClose={onClose}>
      <div style={{ textAlign:"center", marginBottom:20 }}>
        <div style={{ fontSize:40, marginBottom:10 }}>{emoji}</div>
        <p style={{ fontSize:16, fontWeight:700, color:INK, marginBottom:6 }}>{title}</p>
        <p style={{ fontSize:13, color:MUTED, lineHeight:1.5 }}>{desc}</p>
        {sub && <p style={{ fontSize:12, color:RED, marginTop:4 }}>{sub}</p>}
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:12, background:WARM, border:`1px solid ${BORDER}`, borderRadius:12, color:MUTED, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>취소</button>
        <button onClick={onConfirm} style={{ flex:2, padding:12, background:danger?RED:ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{confirmLabel}</button>
      </div>
    </Popup>
  );
}

function ProfilePhotoRow() {
  const { myUid, myName, profileImgUrl, setProfileImgUrl } = useAuthStore();
  const inputRef   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pct,       setPct]       = useState(0);
  const [errMsg,    setErrMsg]    = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !myUid) return;
    e.target.value = "";
    setErrMsg(""); setUploading(true);
    try {
      const path = `users/${myUid}/profile.jpg`;
      const url  = await uploadImage(file, path, setPct);
      await updateDoc(doc(db, "users", myUid), { profileImgUrl: url });
      setProfileImgUrl(url);
    } catch (err: any) {
      setErrMsg(err?.code === "storage/unauthorized" ? "Storage 규칙을 업데이트해주세요." : "업로드 실패. 다시 시도해주세요.");
    } finally { setUploading(false); setPct(0); }
  };

  return (
    <>
      <button onClick={()=>!uploading&&inputRef.current?.click()}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"13px 20px", background:"#fff", border:"none", borderBottom:`1px solid ${BORDER}`, cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
        <div style={{ position:"relative", flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:ROSE, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:16, fontWeight:700 }}>
            {profileImgUrl ? <img src={profileImgUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : myName[0]}
          </div>
          <div style={{ position:"absolute", bottom:-2, right:-2, width:16, height:16, borderRadius:"50%", background:"#fff", border:`1.5px solid ${BORDER}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={MUTED} strokeWidth="2.5" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke={MUTED} strokeWidth="2.5"/></svg>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:14, fontWeight:500, color:INK }}>프로필 사진 변경</p>
          <p style={{ fontSize:12, color:MUTED, marginTop:2 }}>{uploading ? `업로드 중 ${pct}%…` : "탭하여 사진 선택"}</p>
        </div>
        {!uploading && <span style={{ fontSize:18, color:"#C0B8B0" }}>›</span>}
        <input ref={inputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} />
      </button>
      {errMsg && (
        <div style={{ margin:"0 16px 8px", padding:"10px 14px", background:"#FFF0F0", borderRadius:10, border:"1px solid rgba(239,68,68,0.2)" }}>
          <p style={{ fontSize:12, color:RED }}>⚠️ {errMsg}</p>
        </div>
      )}
    </>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { myName, partnerName, startDate, coupleId, role, profileImgUrl, partnerProfileImgUrl,
          setAuth, setStartDate: setAuthStartDate, reset } = useAuthStore();

  const dday = calcDDay(startDate || "2023-01-01");
  const [modal, setModal] = useState<string|null>(null);
  const [notif, setNotif] = useState<NotificationSettings>({ partnerRecord:true, wishlistAdd:true, anniversary:true });
  const [notifPermission, setNotifPermission] = useState<"granted"|"denied"|"default"|"unsupported">("default");
  const [appConfig, setAppConfig] = useState<AppConfig>({ appVersion:"1.0.0", supportEmail:"", notice:"" });

  const setMyName    = (v: string) => setAuth({ myName: v });
  const setStartDate = (v: string) => { setAuth({ startDate: v }); setAuthStartDate(v); };
  const close = () => setModal(null);

  useEffect(() => {
    setNotif(loadNotifSettings());
    if (typeof window !== "undefined" && "Notification" in window) setNotifPermission(Notification.permission as any);
    else setNotifPermission("unsupported");
  }, []);

  // config/app 구독
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "app"), (snap) => {
      if (snap.exists()) setAppConfig(snap.data() as AppConfig);
    });
    return () => unsub();
  }, []);

  const toggleNotif = async (key: keyof NotificationSettings) => {
    if (!notif[key] && notifPermission !== "granted") {
      const token = await requestNotificationPermission();
      if (token) setNotifPermission("granted");
    }
    const next = { ...notif, [key]: !notif[key] };
    setNotif(next); saveNotifSettings(next);
  };

  // ★ 실제 로그아웃
  const handleLogout = async () => {
    try {
      await signOut(auth);
      reset();
      router.replace("/login");
    } catch (e) { console.error("logout error:", e); }
  };

  // ★ 실제 회원 탈퇴
  const handleWithdraw = async () => {
    close();
    try {
      const { deleteUser, reauthenticateWithPopup, GoogleAuthProvider } = await import("firebase/auth");
      const { collection, query, where, getDocs, deleteDoc, doc: fsDoc } = await import("firebase/firestore");
      const { disconnectCouple } = await import("@/lib/firebase/auth");

      const user = auth.currentUser;
      if (!user) { router.replace("/login"); return; }

      // 커플 연동 해제
      if (coupleId) {
        await disconnectCouple(user.uid, coupleId).catch(() => {});
      }

      // 내 visited 기록 삭제
      const visitedSnap = await getDocs(query(collection(db, "visited"), where("authorUid", "==", user.uid)));
      await Promise.all(visitedSnap.docs.map(d => deleteDoc(d.ref)));

      // 내 wishlist 기록 삭제
      const wishSnap = await getDocs(query(collection(db, "wishlist"), where("addedByUid", "==", user.uid)));
      await Promise.all(wishSnap.docs.map(d => deleteDoc(d.ref)));

      // Firestore users 문서 삭제
      await deleteDoc(fsDoc(db, "users", user.uid)).catch(() => {});

      // Firebase Auth 계정 삭제
      try {
        await deleteUser(user);
      } catch (err: any) {
        if (err.code === "auth/requires-recent-login") {
          await reauthenticateWithPopup(user, new GoogleAuthProvider());
          await deleteUser(user);
        } else {
          throw err;
        }
      }

      reset();
      router.replace("/login");
    } catch (err) {
      console.error("탈퇴 오류:", err);
      alert("탈퇴 중 오류가 발생했어요. 다시 시도해주세요.");
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#F5F0EB", maxWidth:480, margin:"0 auto", fontFamily:"inherit", paddingBottom:40 }}>
      <div style={{ background:"#fff", borderBottom:`1px solid ${BORDER}`, padding:"14px 20px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:20 }}>
        <button onClick={()=>router.back()} style={{ background:"none", border:"none", cursor:"pointer", fontSize:24, color:MUTED, lineHeight:1, padding:"0 4px 0 0" }}>‹</button>
        <p style={{ fontSize:17, fontWeight:700, color:INK }}>설정</p>
      </div>

      {/* 공지사항 배너 */}
      {appConfig.notice ? (
        <div style={{ margin:"12px 16px 0", padding:"12px 16px", background:"#FFF8E7", borderRadius:12, border:"1px solid #F5E0A0", display:"flex", alignItems:"flex-start", gap:10 }}>
          <span style={{ fontSize:16, flexShrink:0 }}>📢</span>
          <p style={{ fontSize:13, color:"#7A5C00", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{appConfig.notice}</p>
        </div>
      ) : null}

      {/* 프로필 카드 */}
      <div style={{ margin:"16px 16px 0", background:"#fff", borderRadius:20, padding:20, boxShadow:"0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:ROSE, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:26, fontWeight:800 }}>
              {profileImgUrl ? <img src={profileImgUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : myName[0]}
            </div>
            <div style={{ position:"absolute", bottom:-4, right:-8, width:30, height:30, borderRadius:"50%", background:SAGE, border:"2px solid #fff", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700 }}>
              {partnerProfileImgUrl
                ? <img src={partnerProfileImgUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : (partnerName ? partnerName[0] : "?")}
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
              <p style={{ fontSize:19, fontWeight:800, color:INK }}>{myName}</p>
              {role==="admin" && <div style={{ background:PURPLE, borderRadius:20, padding:"2px 8px" }}><span style={{ fontSize:10, fontWeight:700, color:"#fff" }}>관리자</span></div>}
            </div>
            <p style={{ fontSize:13, color:MUTED }}>
              {partnerName ? `${myName} ❤️ ${partnerName}` : `${myName} · 파트너 미연동`}
            </p>
            {startDate && (
              <div style={{ display:"inline-flex", alignItems:"center", background:ROSE_LT, borderRadius:20, padding:"3px 10px", marginTop:6 }}>
                <span style={{ fontSize:11, fontWeight:700, color:ROSE }}>💑 D+{dday}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <SectionLabel title="내 프로필" />
      <div style={{ borderTop:`1px solid ${BORDER}` }}>
        <Row icon="✏️" label="닉네임 변경" value={myName} onClick={()=>setModal("name")} />
        <ProfilePhotoRow />
      </div>

      <SectionLabel title="커플 정보" />
      <div style={{ borderTop:`1px solid ${BORDER}` }}>
        <Row icon="💑" label="교제 시작일" value={startDate || "미설정"} sub={startDate ? `D+${dday}` : undefined} onClick={()=>setModal("date")} />
        {/* ★ 연동 상태를 서브텍스트로 표시 */}
        <Row
          icon="🔗"
          label="커플 연동 / 초대 코드"
          sub={coupleId && partnerName ? `${partnerName}님과 연동 중` : "미연동"}
          onClick={()=>setModal("invite")}
        />
      </div>

      <SectionLabel title="알림 설정" />
      {notifPermission==="denied" && (
        <div style={{ margin:"0 16px 8px", background:"#FFF0F0", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"10px 14px" }}>
          <p style={{ fontSize:12, color:RED }}>⚠️ 알림 권한이 거부됐습니다. 기기 설정에서 허용해주세요.</p>
        </div>
      )}
      <div style={{ borderTop:`1px solid ${BORDER}` }}>
        <Row icon="📸" label="파트너 새 기록 알림" sub="파트너가 맛집을 기록하면 알려드려요" rightEl={<Toggle on={notif.partnerRecord} onToggle={()=>toggleNotif("partnerRecord")} />} />
        <Row icon="⭐" label="위시리스트 추가 알림" sub="파트너가 가고 싶은 곳을 추가하면 알려드려요" rightEl={<Toggle on={notif.wishlistAdd} onToggle={()=>toggleNotif("wishlistAdd")} />} />
        <Row icon="🎂" label="기념일 알림" sub="교제 100일, 200일, 1주년... 챙겨드려요" rightEl={<Toggle on={notif.anniversary} onToggle={()=>toggleNotif("anniversary")} />} />
      </div>

      <SectionLabel title="지도 데이터 관리" />
      <div style={{ margin:"0 16px 8px", background:"#fff", borderRadius:16, overflow:"hidden", border:`1px solid ${BORDER}` }}>
        <BatchGeocode />
      </div>

      <SectionLabel title="앱 정보" />
      <div style={{ borderTop:`1px solid ${BORDER}` }}>
        <Row icon="ℹ️" label="앱 버전" value={`v${appConfig.appVersion || "1.0.0"}`} />
        <Row icon="📄" label="개인정보 처리방침"       onClick={()=>router.push("/settings/privacy")} />
        <Row icon="📋" label="서비스 이용약관"          onClick={()=>router.push("/settings/terms")} />
        <Row icon="📍" label="위치기반 서비스 이용약관" onClick={()=>router.push("/settings/location-terms")} />
        <Row icon="💬" label="고객센터 / 문의하기" sub={appConfig.supportEmail || undefined} onClick={()=>router.push("/settings/support")} />
      </div>

      {role==="admin" && (
        <>
          <SectionLabel title="관리자" />
          <div style={{ borderTop:`1px solid ${BORDER}` }}>
            <Row icon="🛡️" label="관리자 페이지" sub="신고 처리 · 게시물 관리" onClick={()=>router.push("/admin")}
              rightEl={<div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ background:ROSE_LT, borderRadius:20, padding:"2px 8px" }}><span style={{ fontSize:10, fontWeight:700, color:ROSE }}>ADMIN</span></div><span style={{ fontSize:18, color:"#C0B8B0" }}>›</span></div>} />
          </div>
        </>
      )}

      <SectionLabel title="계정" />
      <div style={{ borderTop:`1px solid ${BORDER}` }}>
        <Row icon="🚪" label="로그아웃"  onClick={()=>setModal("logout")}   danger />
        <Row icon="⚠️" label="회원 탈퇴" onClick={()=>setModal("withdraw")} danger />
      </div>

      {modal==="name"    && <EditNamePopup  current={myName}    onSave={setMyName}    onClose={close} />}
      {modal==="date"    && <EditDatePopup  current={startDate} onSave={setStartDate} onClose={close} />}
      {modal==="invite"  && <InvitePopup onClose={close} />}
      {modal==="logout"  && <ConfirmPopup emoji="👋" title="로그아웃 하시겠어요?" desc="다시 로그인하면 기록이 그대로 있어요." confirmLabel="로그아웃" onConfirm={handleLogout} onClose={close} />}
      {modal==="withdraw" && <ConfirmPopup emoji="⚠️" title="정말 탈퇴하시겠어요?" desc="탈퇴하면 모든 기록이 삭제됩니다." sub="커플 기록도 함께 삭제됩니다." confirmLabel="탈퇴하기" danger onConfirm={handleWithdraw} onClose={close} />}
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
