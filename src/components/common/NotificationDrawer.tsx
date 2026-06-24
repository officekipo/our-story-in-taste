// src/components/common/NotificationDrawer.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { collection, query, where, orderBy, limit, startAfter, onSnapshot, writeBatch, doc, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuthStore } from "@/store/authStore";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const BG      = "#F5F0EB";
const BOTTOM_NAV_H = 60;

const PAGE_SIZE = 20;

const LS_NOTICE_READ = "notif_notice_last_read";
const LS_EVENT_READ  = "notif_event_last_read";

type MainTab = "activity" | "notice" | "event";

interface NotificationItem {
  id: string; type: "visited"|"wishlist"|"anniversary";
  title: string; body: string; read: boolean; createdAt: string;
}
interface AnnouncementItem {
  id: string; title: string; body: string;
  type: "notice"|"event"; pinned: boolean; visible: boolean;
  startAt?: string; endAt?: string; imgUrls?: string[]; createdAt: string;
}

function typeEmoji(type: NotificationItem["type"]) {
  if (type==="visited")     return "🍽️";
  if (type==="wishlist")    return "⭐";
  if (type==="anniversary") return "🎉";
  return "🔔";
}
function relTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff/60000);
    if (m<1)  return "방금";
    if (m<60) return `${m}분 전`;
    const h = Math.floor(m/60);
    if (h<24) return `${h}시간 전`;
    const d = Math.floor(h/24);
    if (d<30) return `${d}일 전`;
    return new Date(iso).toLocaleDateString("ko-KR",{month:"short",day:"numeric"});
  } catch { return ""; }
}
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric"}); }
  catch { return ""; }
}
function isEventActive(a: AnnouncementItem): boolean {
  if (!a.startAt && !a.endAt) return true;
  const today = new Date(); today.setHours(0,0,0,0);
  if (a.startAt) { const s=new Date(a.startAt); s.setHours(0,0,0,0); if (today<s) return false; }
  if (a.endAt)   { const e=new Date(a.endAt);   e.setHours(23,59,59,999); if (today>e) return false; }
  return true;
}

/* ── 이미지 슬라이더 ── */
function ImgSlider({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!urls.length) return null;
  return (
    <div style={{ position:"relative", marginTop:10, borderRadius:10, overflow:"hidden", background:"#000" }}>
      <img src={urls[idx]} alt="" style={{ width:"100%", objectFit:"contain", display:"block" }}/>
      {urls.length>1&&(
        <>
          {idx>0&&<button onClick={(e)=>{e.stopPropagation();setIdx(p=>p-1);}} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", width:28, height:28, borderRadius:"50%", background:"rgba(0,0,0,0.45)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
          {idx<urls.length-1&&<button onClick={(e)=>{e.stopPropagation();setIdx(p=>p+1);}} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", width:28, height:28, borderRadius:"50%", background:"rgba(0,0,0,0.45)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
          <div style={{ position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)", display:"flex", gap:5 }}>
            {urls.map((_,i)=><button key={i} onClick={(e)=>{e.stopPropagation();setIdx(i);}} style={{ width:i===idx?16:6, height:6, borderRadius:3, background:i===idx?"#fff":"rgba(255,255,255,0.5)", border:"none", cursor:"pointer", padding:0, transition:"width 0.2s" }}/>)}
          </div>
        </>
      )}
    </div>
  );
}

export interface NotifBadges { activity: boolean; notice: boolean; event: boolean; }

interface Props { open: boolean; onClose: () => void; onBadges?: (b: NotifBadges) => void; }

export function NotificationDrawer({ open, onClose, onBadges }: Props) {
  const { myUid } = useAuthStore();
  const [tab, setTab]                     = useState<MainTab>("activity");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loadingN, setLoadingN]           = useState(false);
  const [loadingA, setLoadingA]           = useState(false);
  const [expanded, setExpanded]           = useState<Set<string>>(new Set());

  const [notifHasMore,  setNotifHasMore]  = useState(false);
  const [notifLoadMore, setNotifLoadMore] = useState(false);
  const [lastNotifDoc,  setLastNotifDoc]  = useState<QueryDocumentSnapshot<DocumentData>|null>(null);

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });

  useEffect(() => { setExpanded(new Set()); }, [tab]);

  /* 드로어 닫히면 페이지 초기화 */
  useEffect(() => {
    if (!open) {
      setNotifHasMore(false);
      setLastNotifDoc(null);
      setNotifications([]);
    }
  }, [open]);

  /* ── 활동 알림 구독 (첫 페이지 실시간) ── */
  useEffect(() => {
    if (!open||!myUid) return;
    setLoadingN(true);
    const q = query(
      collection(db,"notifications"),
      where("uid","==",myUid),
      orderBy("createdAt","desc"),
      limit(PAGE_SIZE),
    );
    const unsub = onSnapshot(q, (s) => {
      const items = s.docs.map(d=>({id:d.id,...(d.data() as Omit<NotificationItem,"id">)}));
      setNotifications(items);
      setNotifHasMore(s.docs.length===PAGE_SIZE);
      setLastNotifDoc(s.docs[s.docs.length-1]??null);
      setLoadingN(false);
    }, ()=>setLoadingN(false));
    return unsub;
  }, [open,myUid]);

  /* ── 활동 알림 더 보기 ── */
  const loadMoreNotifs = useCallback(async () => {
    if (!myUid||!lastNotifDoc||notifLoadMore) return;
    setNotifLoadMore(true);
    try {
      const q = query(
        collection(db,"notifications"),
        where("uid","==",myUid),
        orderBy("createdAt","desc"),
        startAfter(lastNotifDoc),
        limit(PAGE_SIZE),
      );
      const snap = await getDocs(q);
      const more = snap.docs.map(d=>({id:d.id,...(d.data() as Omit<NotificationItem,"id">)}));
      setNotifications(prev=>[...prev,...more]);
      setNotifHasMore(snap.docs.length===PAGE_SIZE);
      setLastNotifDoc(snap.docs[snap.docs.length-1]??null);
    } finally { setNotifLoadMore(false); }
  }, [myUid, lastNotifDoc, notifLoadMore]);

  /* ── 공지·이벤트 구독 ── */
  useEffect(() => {
    if (!open) return;
    setLoadingA(true);
    const q = query(collection(db,"announcements"),where("visible","==",true),orderBy("pinned","desc"),orderBy("createdAt","desc"),limit(50));
    const unsub = onSnapshot(q, (s)=>{
      setAnnouncements(s.docs.map(d=>{ const v=d.data(); return {id:d.id,title:v.title??"",body:v.body??"",type:v.type??"notice",pinned:v.pinned??false,visible:v.visible??true,startAt:v.startAt,endAt:v.endAt,imgUrls:v.imgUrls??[],createdAt:v.createdAt??""}; }));
      setLoadingA(false);
    }, ()=>setLoadingA(false));
    return unsub;
  }, [open]);

  /* ── ★ 활동 알림 일괄 읽음 처리 — 500개 배치 제한 대응 ── */
  const markAllRead = useCallback(async () => {
    if (!myUid) return;
    try {
      // 500개씩 나눠서 배치 처리
      let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
      while (true) {
        const baseConstraints = [where("uid","==",myUid), where("read","==",false), limit(500)] as const;
        const snap = lastDoc
          ? await getDocs(query(collection(db,"notifications"), ...baseConstraints, startAfter(lastDoc)))
          : await getDocs(query(collection(db,"notifications"), ...baseConstraints));
        if (snap.empty) break;
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.update(doc(db,"notifications",d.id), { read: true }));
        await batch.commit();
        if (snap.docs.length < 500) break;
        lastDoc = snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot<DocumentData>;
      }
    } catch (e) { console.warn("markAllRead error:", e); }
  }, [myUid]);

  /* ── ★ 탭 읽음 처리:
       - activity 탭: 드로어가 열리고 탭이 activity일 때 즉시 + 탭 전환 시
       - notice/event: localStorage 타임스탬프 갱신 ── */
  const markTabRead = useCallback((t: MainTab) => {
    const now = new Date().toISOString();
    if (t==="notice")   localStorage.setItem(LS_NOTICE_READ, now);
    if (t==="event")    localStorage.setItem(LS_EVENT_READ,  now);
    if (t==="activity") markAllRead();
  }, [markAllRead]);

  /* ★ 드로어가 열릴 때 현재 탭 기준으로 즉시 읽음 처리 */
  useEffect(() => {
    if (open) markTabRead(tab);
  }, [open]);  // eslint-disable-line react-hooks/exhaustive-deps

  /* ★ 탭 전환 시 읽음 처리 */
  const handleTabChange = useCallback((t: MainTab) => {
    setTab(t);
    markTabRead(t);
  }, [markTabRead]);

  /* ★ 활동 알림이 로드된 직후에도 읽음 처리 (드로어 열린 상태에서 새 알림 수신 시) */
  useEffect(() => {
    if (open && tab === "activity" && notifications.length > 0) {
      markAllRead();
    }
  }, [notifications]); // eslint-disable-line react-hooks/exhaustive-deps

  const notices = useMemo(()=>announcements.filter(a=>a.type==="notice"), [announcements]);
  const events  = useMemo(()=>announcements.filter(a=>a.type==="event"&&isEventActive(a)), [announcements]);

  /* ── onBadges: 드로어 닫혀있을 때만 뱃지 업데이트 (열려있으면 읽음처리 진행 중) ── */
  useEffect(() => {
    if (!onBadges) return;
    if (open && tab === "activity") {
      // 드로어가 열려있고 activity 탭이면 뱃지 즉시 제거
      onBadges({ activity: false, notice: false, event: false });
      return;
    }
    const noticeLastRead = localStorage.getItem(LS_NOTICE_READ);
    const eventLastRead  = localStorage.getItem(LS_EVENT_READ);
    onBadges({
      activity: !open ? notifications.some(n=>!n.read) : false,
      notice:   notices.some(a=>!noticeLastRead||a.createdAt>noticeLastRead),
      event:    events.some(a=>!eventLastRead||a.createdAt>eventLastRead),
    });
  }, [notifications, notices, events, onBadges, open, tab]);

  if (!open) return null;

  function hasUnread(t: MainTab): boolean {
    if (t==="activity") return notifications.some(n=>!n.read);
    const lastRead = localStorage.getItem(t==="notice"?LS_NOTICE_READ:LS_EVENT_READ);
    return (t==="notice"?notices:events).some(a=>!lastRead||a.createdAt>lastRead);
  }

  const TABS: { id: MainTab; label: string }[] = [
    { id:"activity", label:"활동 알림" },
    { id:"notice",   label:"공지" },
    { id:"event",    label:"이벤트" },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", flexDirection:"column", justifyContent:"flex-end", alignItems:"center" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", animation:"fadeIn 0.18s ease both" }}/>

      <div style={{ position:"relative", width:"100%", maxWidth:480, paddingBottom:BOTTOM_NAV_H, height:"80dvh", background:"#fff", borderRadius:"20px 20px 0 0", display:"flex", flexDirection:"column", boxShadow:"0 -4px 24px rgba(0,0,0,0.14)", animation:"slideUp 0.28s cubic-bezier(0.32,1,0.4,1) both" }}>

        <div style={{ display:"flex", justifyContent:"center", paddingTop:10, paddingBottom:2, flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:BORDER }}/>
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 16px 0", flexShrink:0 }}>
          <span style={{ fontSize:16, fontWeight:700, color:INK }}>알림</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke={MUTED} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div style={{ display:"flex", padding:"8px 16px 0", borderBottom:`1px solid ${BORDER}`, flexShrink:0 }}>
          {TABS.map(({ id, label }) => {
            const active=tab===id, hasDot=hasUnread(id);
            return (
              <button key={id} onClick={()=>handleTabChange(id)} style={{ flex:1, paddingBottom:9, background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:active?700:500, color:active?ROSE:MUTED, borderBottom:active?`2px solid ${ROSE}`:"2px solid transparent", transition:"color 0.15s, border-color 0.15s", position:"relative" }}>
                {label}
                {hasDot&&!active&&<span style={{ position:"absolute", top:2, right:"calc(50% - 18px)", width:6, height:6, borderRadius:"50%", background:ROSE, display:"inline-block" }}/>}
              </button>
            );
          })}
        </div>

        <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch" as any }}>

          {/* ── 활동 알림 ── */}
          {tab==="activity"&&(
            loadingN?<LoadingRows/>:
            notifications.length===0?<EmptyState icon="🔔" text="아직 알림이 없어요" sub="파트너가 기록을 추가하면 알려드려요"/>:
            <>
              {notifications.map(n=>{
                const isOpen=expanded.has(n.id);
                return (
                  <div key={n.id} style={{ borderBottom:`1px solid ${BORDER}`, background:n.read?"#fff":WARM }}>
                    <button onClick={()=>toggleExpand(n.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:n.read?BG:ROSE_LT, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:17 }}>{typeEmoji(n.type)}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:n.read?500:700, color:INK, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.title}</p>
                        <p style={{ fontSize:10, color:"#C0B8B0", marginTop:2 }}>{fmtDate(n.createdAt)}</p>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                        {!n.read&&<div style={{ width:7, height:7, borderRadius:"50%", background:ROSE }}/>}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform:isOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }}><path d="M6 9l6 6 6-6" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </button>
                    {isOpen&&(
                      <div style={{ padding:"0 16px 14px 64px" }}>
                        <p style={{ fontSize:12, color:MUTED, lineHeight:1.6 }}>{n.body}</p>
                        <p style={{ fontSize:11, color:"#C0B8B0", marginTop:6 }}>{relTime(n.createdAt)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {notifHasMore&&(
                <button onClick={loadMoreNotifs} disabled={notifLoadMore} style={{ width:"100%", padding:"14px 0", background:"none", border:"none", borderTop:`1px solid ${BORDER}`, cursor:notifLoadMore?"default":"pointer", fontSize:13, fontWeight:600, color:notifLoadMore?MUTED:ROSE, fontFamily:"inherit" }}>
                  {notifLoadMore?"불러오는 중...":"알림 더 보기"}
                </button>
              )}
              <div style={{ height:12 }}/>
            </>
          )}

          {/* ── 공지 ── */}
          {tab==="notice"&&(
            loadingA?<LoadingRows/>:
            notices.length===0?<EmptyState icon="📢" text="등록된 공지가 없어요" sub="새로운 공지가 생기면 이곳에서 확인하세요"/>:
            <>
              {notices.map(a=>{
                const isOpen=expanded.has(a.id);
                return (
                  <div key={a.id} style={{ borderBottom:`1px solid ${BORDER}` }}>
                    <button onClick={()=>toggleExpand(a.id)} style={{ width:"100%", display:"flex", alignItems:"flex-start", gap:10, padding:"14px 16px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:a.pinned?ROSE_LT:BG, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:17 }}>{a.pinned?"📌":"📢"}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                          {a.pinned&&<span style={{ fontSize:10, fontWeight:700, color:ROSE, background:ROSE_LT, borderRadius:4, padding:"1px 6px", flexShrink:0 }}>고정</span>}
                          <p style={{ fontSize:13, fontWeight:700, color:INK, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</p>
                        </div>
                        <p style={{ fontSize:10, color:"#C0B8B0" }}>{fmtDate(a.createdAt)}</p>
                        {!isOpen&&<p style={{ fontSize:11, color:MUTED, marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.body}</p>}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, marginTop:4, transform:isOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }}><path d="M6 9l6 6 6-6" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {isOpen&&(
                      <div style={{ padding:"0 16px 16px 62px" }}>
                        <p style={{ fontSize:12, color:MUTED, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{a.body}</p>
                        {a.imgUrls&&a.imgUrls.length>0&&<ImgSlider urls={a.imgUrls}/>}
                        <p style={{ fontSize:11, color:"#C0B8B0", marginTop:10 }}>{relTime(a.createdAt)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ height:12 }}/>
            </>
          )}

          {/* ── 이벤트 ── */}
          {tab==="event"&&(
            loadingA?<LoadingRows/>:
            events.length===0?<EmptyState icon="🎉" text="진행 중인 이벤트가 없어요" sub="새로운 이벤트가 시작되면 알려드려요"/>:
            <>
              {events.map(a=>{
                const isOpen=expanded.has(a.id);
                return (
                  <div key={a.id} style={{ borderBottom:`1px solid ${BORDER}` }}>
                    <button onClick={()=>toggleExpand(a.id)} style={{ width:"100%", display:"flex", alignItems:"flex-start", gap:10, padding:"14px 16px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:"#C8DED1", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:17 }}>🎉</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:INK, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:2 }}>{a.title}</p>
                        <p style={{ fontSize:10, color:"#C0B8B0", marginBottom:2 }}>{fmtDate(a.createdAt)}</p>
                        {a.startAt&&a.endAt
                          ?<p style={{ fontSize:11, color:"#4A7A5E", fontWeight:600 }}>{a.startAt} ~ {a.endAt}</p>
                          :!isOpen&&<p style={{ fontSize:11, color:MUTED, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.body}</p>
                        }
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, marginTop:4, transform:isOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }}><path d="M6 9l6 6 6-6" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {isOpen&&(
                      <div style={{ padding:"0 16px 16px 62px" }}>
                        <p style={{ fontSize:12, color:MUTED, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{a.body}</p>
                        {a.imgUrls&&a.imgUrls.length>0&&<ImgSlider urls={a.imgUrls}/>}
                        <p style={{ fontSize:11, color:"#C0B8B0", marginTop:10 }}>{relTime(a.createdAt)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ height:12 }}/>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div>
      {[0,1,2,3].map(i=>(
        <div key={i} style={{ display:"flex", gap:12, padding:"14px 16px", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"#F0EBE3", flexShrink:0 }}/>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8, justifyContent:"center" }}>
            <div style={{ height:12, background:"#F0EBE3", borderRadius:4, width:"55%" }}/>
            <div style={{ height:10, background:"#F0EBE3", borderRadius:4, width:"80%" }}/>
          </div>
        </div>
      ))}
    </div>
  );
}
function EmptyState({ icon, text, sub }: { icon:string; text:string; sub:string }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"52px 24px", gap:10 }}>
      <span style={{ fontSize:40 }}>{icon}</span>
      <p style={{ fontSize:14, fontWeight:600, color:INK }}>{text}</p>
      <p style={{ fontSize:12, color:MUTED, textAlign:"center", lineHeight:1.6 }}>{sub}</p>
    </div>
  );
}
