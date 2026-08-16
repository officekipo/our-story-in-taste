// src/app/admin/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef, CSSProperties, ReactNode } from "react";
import { useRouter }    from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { auth, db, storage } from "@/lib/firebase/config";
import {
  collection, query, orderBy, onSnapshot, where,
  doc, getDoc, updateDoc, deleteDoc, addDoc, getDocs,
  setDoc, getCountFromServer, limit, startAfter,
  QueryDocumentSnapshot, writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

/* ── 색상 ── */
const ROSE   = "#C96B52";
const SAGE   = "#6B9E7E";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";
const PURPLE = "#7B6BAE";
const RED    = "#EF4444";
const BLUE   = "#3B82F6";
const BG     = "#F5F0EB";

/* ── 상수 ── */
const PAGE_SIZE = 30;
const ANN_PAGE  = 20;
const USER_PAGE = 30;

export const FAQ_CATEGORIES = ["커플 연동", "맛집 기록", "위시리스트", "지도·통계", "커뮤니티", "알림", "앱·계정"];

/* ── 타입 ── */
type Tab = "reports" | "posts" | "faq" | "contacts" | "users" | "config" | "announce";

interface FAQItem      { id: string; question: string; answer: string; order: number; category: string; }
interface ContactItem  { id: string; name: string; email: string; message: string; createdAt: string; status: "pending"|"done"; }
interface ReportItem   { id: string; postId: string; postName: string; reason: string; reportedAt: string; status: "pending"|"resolved"; }
interface PostItem     { id: string; name: string; emoji: string; coupleLabel: string; likes: number; authorUid: string; createdAt: string; imgUrls: string[]; }
interface ConfigItem   { appVersion: string; supportEmail: string; notice: string; companyName: string; termsDate: string; }
interface UserItem     { id: string; name: string; role: "admin"|"user"; coupleId: string|null; profileImgUrl: string|null; }
interface UserPost     { id: string; name: string; emoji: string; likes: number; createdAt: string; }
interface AnnounceItem { id: string; title: string; body: string; type: "notice"|"event"; pinned: boolean; visible: boolean; startAt: string; endAt: string; imgUrls: string[]; createdAt: string; }

/* ── 페이지네이션 상태 ── */
interface PageState<T> {
  items:   T[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
  loading: boolean;
}
function initPage<T>(): PageState<T> { return { items: [], lastDoc: null, hasMore: false, loading: false }; }

/* ── API 헬퍼 ── */
async function adminFetch(path: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인 상태가 아닙니다.");
  const token = await user.getIdToken(true);
  return fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
  });
}

/* ── 공지 이미지 Storage 헬퍼 ── */
async function uploadAnnounceImages(files: File[], annId: string): Promise<string[]> {
  return Promise.all(files.map(async (file, i) => {
    const path = `announcements/${annId}/${Date.now()}_${i}_${file.name}`;
    const snap = await uploadBytes(ref(storage, path), file);
    return getDownloadURL(snap.ref);
  }));
}
async function deleteAnnounceImages(urls: string[]) {
  await Promise.allSettled(urls.map(async (url) => {
    try {
      const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
      await deleteObject(ref(storage, path));
    } catch {}
  }));
}

/* ── 공통 UI ── */
function btnStyle(color: string, outline?: boolean): CSSProperties {
  return { padding: "6px 14px", background: outline ? color + "1A" : color, border: outline ? `1px solid ${color}60` : "none", borderRadius: 10, color: outline ? color : "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
}

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position:"fixed", bottom:32, left:"50%", transform:"translateX(-50%)", background:"rgba(26,20,18,0.9)", color:"#fff", padding:"10px 20px", borderRadius:24, fontSize:13, fontWeight:600, zIndex:9999, whiteSpace:"nowrap", pointerEvents:"none" }}>
      {msg}
    </div>
  );
}

function EmptyBox({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ background:"#fff", borderRadius:16, padding:"40px 20px", textAlign:"center", boxShadow:"0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize:44, marginBottom:12 }}>{icon}</div>
      <p style={{ fontSize:14, color:MUTED }}>{text}</p>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ background:color+"1A", borderRadius:20, padding:"2px 8px", display:"inline-block" }}>
      <span style={{ fontSize:10, fontWeight:700, color }}>{text}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #F0EBE3" }}>
      <span style={{ fontSize:13, color:MUTED }}>{label}</span>
      <span style={{ fontSize:13, color:INK, fontWeight:500, maxWidth:"60%", textAlign:"right", wordBreak:"break-all" }}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom:18 }}>
      <p style={{ fontSize:11, fontWeight:700, color:MUTED, letterSpacing:0.5, marginBottom:6, textTransform:"uppercase" }}>{title}</p>
      <div style={{ background:WARM, borderRadius:12, padding:"4px 14px" }}>{children}</div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex:1, background:"#fff", borderRadius:10, padding:12, textAlign:"center", border:`1px solid ${BORDER}` }}>
      <p style={{ fontSize:22, fontWeight:700, color }}>{value}</p>
      <p style={{ fontSize:11, color:MUTED, marginTop:2 }}>{label}</p>
    </div>
  );
}

function LoadMoreBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ width:"100%", padding:"14px 0", background:"#fff", border:`1px solid ${BORDER}`, borderRadius:14, cursor:loading?"default":"pointer", fontSize:13, fontWeight:600, color:loading?MUTED:ROSE, fontFamily:"inherit", marginBottom:10, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      {loading ? "불러오는 중..." : "더 보기"}
    </button>
  );
}

/* ── 검색 바 공통 컴포넌트 ── */
function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const inp: CSSProperties = { width:"100%", padding:"10px 12px 10px 36px", background:"#fff", border:`1px solid ${BORDER}`, borderRadius:12, fontSize:13, fontFamily:"inherit", outline:"none", color:INK, boxSizing:"border-box" };
  return (
    <div style={{ position:"relative", marginBottom:12 }}>
      <svg style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke={MUTED} strokeWidth="2"/>
        <path d="M16.5 16.5L21 21" stroke={MUTED} strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inp}/>
      {value && (
        <button onClick={() => onChange("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:MUTED, fontSize:16, lineHeight:1 }}>×</button>
      )}
    </div>
  );
}

/* ════════════════ 유저 상세 팝업 ════════════════ */
function UserDetailModal({ user, onClose, onToast }: { user: UserItem; onClose: ()=>void; onToast: (m:string)=>void }) {
  const [authInfo,    setAuthInfo]    = useState<{email:string|null;emailVerified:boolean;lastSignInTime:string|null;creationTime:string|null}|null>(null);
  const [coupleInfo,  setCoupleInfo]  = useState<{partnerName:string;partnerUid:string;startDate:string}|null>(null);
  const [posts,       setPosts]       = useState<UserPost[]>([]);
  // ★ v22: "게시글" = 커뮤니티 공유글(posts)이 아니라 다녀온 곳 + 위시리스트 전체 기록 수
  const [totalCount,  setTotalCount]  = useState(0);
  const [reportTotal, setReportTotal] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [newPw,       setNewPw]       = useState("");
  const [pwLoading,   setPwLoading]   = useState(false);

  /* ★ 모든 데이터 Promise.all 병렬 로드 */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const loadAll = async () => {
      try {
        const [authRes, communitySnap, visitedCountSnap, wishCountSnap] = await Promise.all([
          adminFetch(`/api/admin/user/${user.id}`),
          getDocs(query(collection(db, "community"), where("authorUid", "==", user.id))),
          // ★ v22: 전체 게시글 개수 = 다녀온 곳(visited) + 위시리스트(wishlist) 합산
          getCountFromServer(query(collection(db, "visited"),  where("authorUid",  "==", user.id))),
          getCountFromServer(query(collection(db, "wishlist"), where("addedByUid", "==", user.id))),
        ]);
        if (cancelled) return;

        const authData = await authRes.json();
        if (!cancelled) setAuthInfo(authData);

        if (!cancelled) {
          setTotalCount(visitedCountSnap.data().count + wishCountSnap.data().count);
        }

        const postList: UserPost[] = communitySnap.docs.map(d => {
          const v = d.data();
          return { id: d.id, name: v.name ?? "", emoji: v.emoji ?? "🍽️", likes: v.likeCount ?? 0, createdAt: v.createdAt ?? "" };
        }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        if (!cancelled) setPosts(postList);

        const parallelTasks: Promise<void>[] = [];
        if (user.coupleId) {
          parallelTasks.push((async () => {
            const coupleSnap = await getDoc(doc(db, "couples", user.coupleId!));
            if (!coupleSnap.exists() || cancelled) return;
            const d = coupleSnap.data();
            const partnerUid = d.user1Uid === user.id ? d.user2Uid : d.user1Uid;
            if (!partnerUid) return;
            const ps = await getDoc(doc(db, "users", partnerUid));
            if (!cancelled && ps.exists()) setCoupleInfo({ partnerName: ps.data().name ?? "이름 없음", partnerUid, startDate: d.startDate ?? "—" });
          })());
        }
        if (postList.length > 0) {
          const ids = postList.map(p => p.id);
          const chunks: string[][] = [];
          for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
          parallelTasks.push(
            Promise.all(chunks.map(c => getCountFromServer(query(collection(db, "community_reports"), where("postId", "in", c))))).then(results => {
              if (!cancelled) setReportTotal(results.reduce((sum, x) => sum + x.data().count, 0));
            })
          );
        }
        await Promise.all(parallelTasks);
      } catch (e) {
        console.error("UserDetailModal load error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadAll();
    return () => { cancelled = true; };
  }, [user.id, user.coupleId]);

  const toggleRole = useCallback(async () => {
    const r = user.role === "admin" ? "user" : "admin";
    await updateDoc(doc(db, "users", user.id), { role: r });
    onToast(`역할을 ${r === "admin" ? "관리자" : "일반 유저"}로 변경했어요`);
    onClose();
  }, [user.id, user.role, onToast, onClose]);

  const changePw = useCallback(async () => {
    if (newPw.length < 6) { onToast("비밀번호는 6자 이상이어야 해요"); return; }
    setPwLoading(true);
    try {
      const res = await adminFetch(`/api/admin/user/${user.id}`, { method: "PATCH", body: JSON.stringify({ password: newPw }) });
      if (res.ok) { onToast("✅ 비밀번호를 변경했어요"); setNewPw(""); }
      else { const e = await res.json(); onToast(`❌ ${e.error ?? "변경 실패"}`); }
    } finally { setPwLoading(false); }
  }, [user.id, newPw, onToast]);

  const forceVerify = useCallback(async () => {
    const res = await adminFetch(`/api/admin/user/${user.id}`, { method: "PATCH", body: JSON.stringify({ emailVerified: true }) });
    if (res.ok) { setAuthInfo(p => p ? { ...p, emailVerified: true } : p); onToast("✅ 강제 인증 완료"); }
    else { onToast("❌ 인증 처리 실패"); }
  }, [user.id, onToast]);

  const fmt = (s: string | null | undefined) => {
    if (!s) return "—";
    try { return new Date(s).toLocaleString("ko-KR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" }); }
    catch { return s; }
  };

  const inp: CSSProperties = { flex:1, padding:"10px 12px", background:WARM, border:`1px solid ${BORDER}`, borderRadius:10, fontSize:13, fontFamily:"inherit", outline:"none", color:INK };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto", padding:"20px 20px 40px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:user.role==="admin"?PURPLE+"20":WARM, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
              {user.role === "admin" ? "👑" : "👤"}
            </div>
            <div>
              <p style={{ fontSize:16, fontWeight:700, color:INK }}>{user.name}</p>
              <div style={{ display:"flex", gap:4, marginTop:2 }}>
                <Badge text={user.role==="admin"?"관리자":"유저"} color={user.role==="admin"?PURPLE:SAGE}/>
                {user.coupleId && <Badge text="커플 연동" color={ROSE}/>}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, color:MUTED, cursor:"pointer" }}>×</button>
        </div>

        {loading ? (
          <div style={{ padding:"40px 0", textAlign:"center" }}>
            <div style={{ width:32, height:32, border:`3px solid ${BORDER}`, borderTopColor:ROSE, borderRadius:"50%", margin:"0 auto", animation:"spin 0.8s linear infinite" }}/>
            <p style={{ fontSize:13, color:MUTED, marginTop:12 }}>정보 불러오는 중...</p>
          </div>
        ) : (
          <>
            <Section title="계정 정보">
              <Row label="이메일" value={authInfo ? (authInfo.email ?? "소셜 로그인") : "—"}/>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${BORDER}` }}>
                <span style={{ fontSize:13, color:MUTED }}>이메일 인증</span>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:authInfo?.emailVerified ? "#059669" : RED }}>
                    {authInfo?.emailVerified ? "✅ 인증됨" : "❌ 미인증"}
                  </span>
                  {authInfo && !authInfo.emailVerified && (
                    <button onClick={forceVerify} style={{ padding:"4px 10px", background:"#05966920", border:"1px solid #05966960", borderRadius:8, color:"#059669", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>강제 인증</button>
                  )}
                </div>
              </div>
              <Row label="가입일" value={fmt(authInfo?.creationTime)}/>
              <Row label="마지막 로그인" value={fmt(authInfo?.lastSignInTime)}/>
            </Section>

            <Section title="역할 관리">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0" }}>
                <span style={{ fontSize:13, color:MUTED }}>현재 역할: <strong style={{ color:user.role==="admin"?PURPLE:INK }}>{user.role==="admin"?"관리자":"일반 유저"}</strong></span>
                <button onClick={toggleRole} style={{ padding:"7px 14px", background:user.role==="admin"?RED+"1A":PURPLE+"1A", border:`1px solid ${user.role==="admin"?RED:PURPLE}60`, borderRadius:10, color:user.role==="admin"?RED:PURPLE, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  {user.role === "admin" ? "관리자 제거" : "관리자 등록"}
                </button>
              </div>
            </Section>

            <Section title="비밀번호 변경">
              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                <input type="password" placeholder="새 비밀번호 (6자 이상)" value={newPw} onChange={e => setNewPw(e.target.value)} style={inp}/>
                <button onClick={changePw} disabled={pwLoading} style={{ padding:"10px 14px", background:newPw.length>=6?BLUE:"#C0B8B0", border:"none", borderRadius:10, color:"#fff", fontSize:12, fontWeight:600, cursor:newPw.length>=6?"pointer":"default", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                  {pwLoading ? "변경 중..." : "변경"}
                </button>
              </div>
            </Section>

            <Section title="커플 정보">
              {coupleInfo ? (
                <>
                  <Row label="교제 시작일" value={coupleInfo.startDate}/>
                  <Row label="파트너 이름" value={coupleInfo.partnerName}/>
                  <Row label="파트너 UID" value={coupleInfo.partnerUid.slice(0, 16) + "..."}/>
                </>
              ) : (
                <div style={{ padding:"10px 0" }}><span style={{ fontSize:13, color:MUTED }}>커플 연동 없음</span></div>
              )}
            </Section>

            <Section title="활동 통계">
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                {/* ★ v22: 다녀온 곳 + 위시리스트 전체 기록 수 (기존엔 커뮤니티 공유글만 카운팅되던 버그) */}
                <StatCard label="전체 게시글" value={totalCount} color={SAGE}/>
                <StatCard label="추천글 공유" value={posts.length} color={PURPLE}/>
                <StatCard label="신고 횟수" value={reportTotal} color={reportTotal > 0 ? RED : MUTED}/>
              </div>
            </Section>

            {posts.length > 0 && (
              <Section title="추천글 목록 (커뮤니티 공유)">
                {posts.map(p => (
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${BORDER}` }}>
                    <span style={{ fontSize:20 }}>{p.emoji}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:INK, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</p>
                      <p style={{ fontSize:11, color:MUTED, marginTop:2 }}>{p.createdAt?.slice(0, 10)} · ❤️ {p.likes}</p>
                    </div>
                  </div>
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════ 메인 ════════════════ */
export default function AdminPage() {
  const router           = useRouter();
  const { role, myName } = useAuthStore();

  const [tab,   setTab]   = useState<Tab>("reports");
  const [toast, setToast] = useState<string|null>(null);
  const toastTimerRef     = useRef<ReturnType<typeof setTimeout>|null>(null);

  /* ── 탭별 데이터 ── */
  const [reports,   setReports]   = useState<PageState<ReportItem>>(initPage());
  const [posts,     setPosts]     = useState<PageState<PostItem>>(initPage());
  const [faqs,      setFaqs]      = useState<FAQItem[]>([]);
  const [contacts,  setContacts]  = useState<PageState<ContactItem>>(initPage());
  const [users,     setUsers]     = useState<PageState<UserItem>>(initPage());
  const [announces, setAnnounces] = useState<PageState<AnnounceItem>>(initPage());
  const [config,    setConfig]    = useState<ConfigItem>({ appVersion:"1.0.0", supportEmail:"", notice:"", companyName:"", termsDate:"" });
  const [badgeCounts, setBadgeCounts] = useState({ reports:0, posts:0, contacts:0 });

  /* ── 각 탭 검색 상태 ── */
  const [searchReports,  setSearchReports]  = useState("");
  const [searchPosts,    setSearchPosts]    = useState("");
  const [searchContacts, setSearchContacts] = useState("");
  const [searchUsers,    setSearchUsers]    = useState("");
  const [searchAnn,      setSearchAnn]      = useState("");

  /* ── 유저 prefix 검색 ── */
  // 서버 prefix 쿼리: name >= keyword AND name < keyword + '\uf8ff'
  const [userSearchActive, setUserSearchActive] = useState(false);

  /* ── FAQ ── */
  const [faqEdit,      setFaqEdit]      = useState<FAQItem|null>(null);
  const [faqQ,         setFaqQ]         = useState("");
  const [faqA,         setFaqA]         = useState("");
  const [faqCat,       setFaqCat]       = useState(FAQ_CATEGORIES[0]);
  const [faqFilterCat, setFaqFilterCat] = useState(FAQ_CATEGORIES[0]);
  const [searchFaq,    setSearchFaq]    = useState("");

  /* ── Config ── */
  const [cfgEdit,  setCfgEdit]  = useState(false);
  const [cfgDraft, setCfgDraft] = useState<ConfigItem>(config);

  /* ── 전체 푸시 ── */
  const [pushTitle,   setPushTitle]   = useState("");
  const [pushBody,    setPushBody]    = useState("");
  const [pushLoading, setPushLoading] = useState(false);

  /* ── 유저 상세 ── */
  const [selectedUser, setSelectedUser] = useState<UserItem|null>(null);

  /* ── 공지 폼 ── */
  const EMPTY_ANN: Omit<AnnounceItem, "id"|"createdAt"> = { title:"", body:"", type:"notice", pinned:false, visible:true, startAt:"", endAt:"", imgUrls:[] };
  const [annEdit,      setAnnEdit]      = useState<AnnounceItem|null>(null);
  const [annDraft,     setAnnDraft]     = useState<Omit<AnnounceItem,"id"|"createdAt">>(EMPTY_ANN);
  const [annForm,      setAnnForm]      = useState(false);
  const [annFiles,     setAnnFiles]     = useState<File[]>([]);
  const [annPreviews,  setAnnPreviews]  = useState<string[]>([]);
  const [annDelUrls,   setAnnDelUrls]   = useState<string[]>([]);
  const [annUploading, setAnnUploading] = useState(false);
  const annFileRef = useRef<HTMLInputElement>(null);

  const unsubRef     = useRef<(()=>void)|null>(null);
  const userTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  /* ── 권한 체크 ── */
  useEffect(() => { if (role !== "admin") router.replace("/"); }, [role, router]);
  if (role !== "admin") return null;

  /* ── 토스트 ── */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  /* ── 뱃지 카운트 (1회) ── */
  useEffect(() => {
    (async () => {
      try {
        const [r, p, c] = await Promise.all([
          getCountFromServer(query(collection(db, "community_reports"), where("status", "==", "pending"))),
          getCountFromServer(query(collection(db, "community"))),
          getCountFromServer(query(collection(db, "contacts"), where("status", "==", "pending"))),
        ]);
        setBadgeCounts({ reports: r.data().count, posts: p.data().count, contacts: c.data().count });
      } catch {}
    })();
  }, []);

  /* ══════════════════════════════════════════
     유저 탭 — 서버 prefix 검색 + 페이지네이션
     ══════════════════════════════════════════ */
  const fetchUsers = useCallback(async (keyword: string, append = false, lastDocSnap: QueryDocumentSnapshot|null = null) => {
    setUsers(p => ({ ...p, loading: true }));
    try {
      let q;
      if (keyword.trim()) {
        // prefix 검색: name >= keyword AND name < keyword + \uf8ff
        const end = keyword.trim() + "\uf8ff";
        q = lastDocSnap
          ? query(collection(db, "users"), orderBy("name"), where("name", ">=", keyword.trim()), where("name", "<", end), startAfter(lastDocSnap), limit(USER_PAGE))
          : query(collection(db, "users"), orderBy("name"), where("name", ">=", keyword.trim()), where("name", "<", end), limit(USER_PAGE));
      } else {
        q = lastDocSnap
          ? query(collection(db, "users"), orderBy("name"), startAfter(lastDocSnap), limit(USER_PAGE))
          : query(collection(db, "users"), orderBy("name"), limit(USER_PAGE));
      }
      const snap = await getDocs(q);
      const items: UserItem[] = snap.docs.map(x => {
        const v = x.data();
        return { id: x.id, name: v.name ?? "이름 없음", role: v.role ?? "user", coupleId: v.coupleId ?? null, profileImgUrl: v.profileImgUrl ?? null };
      });
      const lastSnap = snap.docs[snap.docs.length - 1] ?? null;
      setUsers(p => ({
        items: append ? [...p.items, ...items] : items,
        lastDoc: lastSnap,
        hasMore: snap.docs.length === USER_PAGE,
        loading: false,
      }));
    } catch { setUsers(p => ({ ...p, loading: false })); }
  }, []);

  /* ── 유저 검색 debounce ── */
  useEffect(() => {
    if (tab !== "users") return;
    if (userTimerRef.current) clearTimeout(userTimerRef.current);
    userTimerRef.current = setTimeout(() => {
      setUserSearchActive(!!searchUsers.trim());
      fetchUsers(searchUsers, false, null);
    }, 350);
  }, [searchUsers, tab, fetchUsers]);

  const loadMoreUsers = useCallback(() => {
    if (!users.lastDoc || users.loading) return;
    fetchUsers(searchUsers, true, users.lastDoc);
  }, [users.lastDoc, users.loading, searchUsers, fetchUsers]);

  /* ── 탭별 lazy 구독 / 초기 로드 ── */
  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }

    switch (tab) {
      case "reports": {
        /* ★ community 컬렉션: orderBy("createdAt") 단일 인덱스만 사용
           Firestore 복합 인덱스 없이도 동작하도록 단순화 */
        const unsub = onSnapshot(
          query(collection(db, "community_reports"), orderBy("reportedAt", "desc"), limit(PAGE_SIZE)),
          s => {
            const d = s.docs.map(x => ({ id: x.id, ...x.data() } as ReportItem));
            setReports({ items: d, lastDoc: s.docs[s.docs.length - 1] ?? null, hasMore: s.docs.length === PAGE_SIZE, loading: false });
            setBadgeCounts(p => ({ ...p, reports: d.filter(r => r.status === "pending").length }));
          }
        );
        unsubRef.current = unsub;
        break;
      }
      case "posts": {
        /* ★ 단일 orderBy("createdAt") — 복합 인덱스 불필요, 5개 제한 문제 해소 */
        const unsub = onSnapshot(
          query(collection(db, "community"), orderBy("createdAt", "desc"), limit(PAGE_SIZE)),
          s => {
            const d = s.docs.map(x => {
              const v = x.data();
              return {
                id: x.id,
                name: v.name ?? "",
                emoji: v.emoji ?? "🍽️",
                coupleLabel: v.showAuthorName === false ? "익명 커플" : (v.authorName ? `${v.authorName}의 추천` : "커플 추천"),
                likes: v.likeCount ?? 0,
                authorUid: v.authorUid ?? "",
                createdAt: v.createdAt ?? "",
                imgUrls: Array.isArray(v.imgUrls) ? v.imgUrls : [],
              } as PostItem;
            });
            setPosts({ items: d, lastDoc: s.docs[s.docs.length - 1] ?? null, hasMore: s.docs.length === PAGE_SIZE, loading: false });
            setBadgeCounts(p => ({ ...p, posts: d.length }));
          }
        );
        unsubRef.current = unsub;
        break;
      }
      case "faq": {
        const unsub = onSnapshot(query(collection(db, "faq"), orderBy("order", "asc")), s => setFaqs(s.docs.map(x => ({ id: x.id, ...x.data() } as FAQItem))));
        unsubRef.current = unsub;
        break;
      }
      case "contacts": {
        const unsub = onSnapshot(
          query(collection(db, "contacts"), orderBy("createdAt", "desc"), limit(PAGE_SIZE)),
          s => {
            const d = s.docs.map(x => ({ id: x.id, ...x.data() } as ContactItem));
            setContacts({ items: d, lastDoc: s.docs[s.docs.length - 1] ?? null, hasMore: s.docs.length === PAGE_SIZE, loading: false });
            setBadgeCounts(p => ({ ...p, contacts: d.filter(c => c.status === "pending").length }));
          }
        );
        unsubRef.current = unsub;
        break;
      }
      case "users": {
        /* 유저 탭은 fetchUsers로 관리 (onSnapshot 아님) */
        fetchUsers("", false, null);
        break;
      }
      case "config": {
        const unsub = onSnapshot(doc(db, "config", "app"), s => {
          if (s.exists()) {
            const d = s.data();
            const cfg: ConfigItem = { appVersion: d.appVersion ?? "1.0.0", supportEmail: d.supportEmail ?? "", notice: d.notice ?? "", companyName: d.companyName ?? "", termsDate: d.termsDate ?? "" };
            setConfig(cfg); setCfgDraft(cfg);
          }
        });
        unsubRef.current = unsub;
        break;
      }
      case "announce": {
        setAnnounces(p => ({ ...p, loading: true }));
        getDocs(query(collection(db, "announcements"), orderBy("pinned", "desc"), orderBy("createdAt", "desc"), limit(ANN_PAGE))).then(s => {
          const items = s.docs.map(x => {
            const v = x.data();
            return { id: x.id, title: v.title ?? "", body: v.body ?? "", type: v.type ?? "notice", pinned: v.pinned ?? false, visible: v.visible ?? true, startAt: v.startAt ?? "", endAt: v.endAt ?? "", imgUrls: v.imgUrls ?? [], createdAt: v.createdAt ?? "" } as AnnounceItem;
          });
          setAnnounces({ items, lastDoc: s.docs[s.docs.length - 1] ?? null, hasMore: s.docs.length === ANN_PAGE, loading: false });
        }).catch(() => setAnnounces(p => ({ ...p, loading: false })));
        break;
      }
    }
    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, [tab, fetchUsers]);

  /* ── 더 보기 공통 (신고/게시물/문의) ── */
  const loadMoreGeneric = useCallback(async (
    collectionName: string,
    orderField: string,
    setter: React.Dispatch<React.SetStateAction<PageState<any>>>,
    mapper: (x: QueryDocumentSnapshot) => any,
    lastDocSnap: QueryDocumentSnapshot | null,
  ) => {
    if (!lastDocSnap) return;
    setter(p => ({ ...p, loading: true }));
    try {
      const snap = await getDocs(query(collection(db, collectionName), orderBy(orderField, "desc"), startAfter(lastDocSnap), limit(PAGE_SIZE)));
      setter(p => ({ items: [...p.items, ...snap.docs.map(mapper)], lastDoc: snap.docs[snap.docs.length - 1] ?? null, hasMore: snap.docs.length === PAGE_SIZE, loading: false }));
    } catch { setter(p => ({ ...p, loading: false })); }
  }, []);

  const loadMoreReports  = useCallback(() => loadMoreGeneric("community_reports", "reportedAt", setReports,  x => ({ id: x.id, ...x.data() } as ReportItem),  reports.lastDoc),  [reports.lastDoc,  loadMoreGeneric]);
  const loadMorePosts    = useCallback(() => loadMoreGeneric("community",          "createdAt",  setPosts,    x => { const v = x.data(); return { id: x.id, name: v.name ?? "", emoji: v.emoji ?? "🍽️", coupleLabel: v.showAuthorName === false ? "익명 커플" : (v.authorName ? `${v.authorName}의 추천` : "커플 추천"), likes: v.likeCount ?? 0, authorUid: v.authorUid ?? "", createdAt: v.createdAt ?? "", imgUrls: Array.isArray(v.imgUrls) ? v.imgUrls : [] } as PostItem; }, posts.lastDoc),    [posts.lastDoc,    loadMoreGeneric]);
  const loadMoreContacts = useCallback(() => loadMoreGeneric("contacts",           "createdAt",  setContacts, x => ({ id: x.id, ...x.data() } as ContactItem), contacts.lastDoc), [contacts.lastDoc, loadMoreGeneric]);

  const loadMoreAnn = useCallback(async () => {
    if (!announces.lastDoc || announces.loading) return;
    setAnnounces(p => ({ ...p, loading: true }));
    try {
      const snap = await getDocs(query(collection(db, "announcements"), orderBy("pinned", "desc"), orderBy("createdAt", "desc"), startAfter(announces.lastDoc), limit(ANN_PAGE)));
      const more = snap.docs.map(x => { const v = x.data(); return { id: x.id, title: v.title ?? "", body: v.body ?? "", type: v.type ?? "notice", pinned: v.pinned ?? false, visible: v.visible ?? true, startAt: v.startAt ?? "", endAt: v.endAt ?? "", imgUrls: v.imgUrls ?? [], createdAt: v.createdAt ?? "" } as AnnounceItem; });
      setAnnounces(p => ({ items: [...p.items, ...more], lastDoc: snap.docs[snap.docs.length - 1] ?? null, hasMore: snap.docs.length === ANN_PAGE, loading: false }));
    } catch { setAnnounces(p => ({ ...p, loading: false })); }
  }, [announces.lastDoc, announces.loading]);

  /* ── 게시물 삭제 (연관 신고 batch) ── */
  const deletePost = useCallback(async (id: string, name: string) => {
    try {
      const reportSnap = await getDocs(query(collection(db, "community_reports"), where("postId", "==", id)));
      const batch = writeBatch(db);
      batch.delete(doc(db, "community", id));
      reportSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setPosts(p => ({ ...p, items: p.items.filter(x => x.id !== id) }));
      showToast(`"${name}" 삭제됨`);
    } catch { showToast("❌ 삭제 실패"); }
  }, [showToast]);

  const resolveReport = useCallback(async (id: string) => {
    await updateDoc(doc(db, "community_reports", id), { status: "resolved" });
    showToast("신고 처리 완료");
  }, [showToast]);

  /* ── FAQ ── */
  const resetFaqForm = useCallback(() => { setFaqEdit(null); setFaqQ(""); setFaqA(""); setFaqCat(FAQ_CATEGORIES[0]); }, []);
  const saveFaq = useCallback(async () => {
    if (!faqQ.trim() || !faqA.trim()) return;
    if (faqEdit) { await updateDoc(doc(db, "faq", faqEdit.id), { question: faqQ, answer: faqA, category: faqCat }); showToast("FAQ 수정 완료"); }
    else { await addDoc(collection(db, "faq"), { question: faqQ, answer: faqA, category: faqCat, order: faqs.length }); showToast("FAQ 추가됨"); }
    resetFaqForm();
  }, [faqQ, faqA, faqCat, faqEdit, faqs.length, showToast, resetFaqForm]);

  const deleteFaq   = useCallback(async (id: string) => { await deleteDoc(doc(db, "faq", id)); showToast("FAQ 삭제됨"); }, [showToast]);
  const doneContact = useCallback(async (id: string) => { await updateDoc(doc(db, "contacts", id), { status: "done" }); showToast("문의 처리 완료"); }, [showToast]);
  const saveConfig  = useCallback(async () => { await setDoc(doc(db, "config", "app"), cfgDraft, { merge: true }); setCfgEdit(false); showToast("설정 저장됨"); }, [cfgDraft, showToast]);

  const sendPushAll = useCallback(async () => {
    if (!pushTitle.trim() || !pushBody.trim()) return;
    setPushLoading(true);
    try {
      const res = await adminFetch("/api/notify-all", { method: "POST", body: JSON.stringify({ title: pushTitle, body: pushBody }) });
      const j = await res.json();
      if (res.ok) { showToast(`✅ ${j.sent}명에게 발송`); setPushTitle(""); setPushBody(""); }
      else { showToast(`❌ ${j.error ?? "발송 실패"}`); }
    } finally { setPushLoading(false); }
  }, [pushTitle, pushBody, showToast]);

  /* ── 공지 이미지 처리 ── */
  const handleAnnImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const remaining = 5 - (annDraft.imgUrls.length - annDelUrls.length) - annFiles.length;
    const toAdd = selected.slice(0, remaining);
    setAnnFiles(p => [...p, ...toAdd]);
    setAnnPreviews(p => [...p, ...toAdd.map(f => URL.createObjectURL(f))]);
    if (annFileRef.current) annFileRef.current.value = "";
  };
  const removeNewImage    = (idx: number) => { URL.revokeObjectURL(annPreviews[idx]); setAnnFiles(p => p.filter((_, i) => i !== idx)); setAnnPreviews(p => p.filter((_, i) => i !== idx)); };
  const markDelExisting   = (url: string) => { setAnnDelUrls(p => [...p, url]); setAnnDraft(p => ({ ...p, imgUrls: p.imgUrls.filter(u => u !== url) })); };
  const resetAnnForm      = useCallback(() => {
    setAnnEdit(null); setAnnDraft(EMPTY_ANN); setAnnForm(false);
    annFiles.forEach((_, i) => URL.revokeObjectURL(annPreviews[i]));
    setAnnFiles([]); setAnnPreviews([]); setAnnDelUrls([]);
  }, [annFiles, annPreviews]);

  const saveAnnounce = useCallback(async () => {
    if (!annDraft.title.trim() || !annDraft.body.trim()) return;
    setAnnUploading(true);
    try {
      if (annDelUrls.length) await deleteAnnounceImages(annDelUrls);
      let finalImgUrls: string[];
      if (annEdit) {
        let newUrls: string[] = [];
        if (annFiles.length) newUrls = await uploadAnnounceImages(annFiles, annEdit.id);
        finalImgUrls = [...annDraft.imgUrls, ...newUrls];
        await updateDoc(doc(db, "announcements", annEdit.id), { ...annDraft, imgUrls: finalImgUrls });
        setAnnounces(p => ({ ...p, items: p.items.map(a => a.id === annEdit.id ? { ...a, ...annDraft, imgUrls: finalImgUrls } : a) }));
        showToast("공지 수정 완료");
      } else {
        const newRef = await addDoc(collection(db, "announcements"), { ...annDraft, imgUrls: [], createdAt: new Date().toISOString() });
        let newUrls: string[] = [];
        if (annFiles.length) { newUrls = await uploadAnnounceImages(annFiles, newRef.id); await updateDoc(newRef, { imgUrls: newUrls }); }
        finalImgUrls = newUrls;
        setAnnounces(p => ({ ...p, items: [{ id: newRef.id, ...annDraft, imgUrls: finalImgUrls, createdAt: new Date().toISOString() }, ...p.items] }));
        showToast("공지 등록됨");
      }
      resetAnnForm();
    } catch (e) { console.error(e); showToast("❌ 저장 실패"); }
    finally { setAnnUploading(false); }
  }, [annDraft, annEdit, annFiles, annDelUrls, showToast, resetAnnForm]);

  const deleteAnnounce = useCallback(async (a: AnnounceItem) => {
    if (a.imgUrls?.length) await deleteAnnounceImages(a.imgUrls);
    await deleteDoc(doc(db, "announcements", a.id));
    setAnnounces(p => ({ ...p, items: p.items.filter(x => x.id !== a.id) }));
    showToast("공지 삭제됨");
  }, [showToast]);

  const toggleVisible = useCallback(async (a: AnnounceItem) => {
    await updateDoc(doc(db, "announcements", a.id), { visible: !a.visible });
    setAnnounces(p => ({ ...p, items: p.items.map(x => x.id === a.id ? { ...x, visible: !x.visible } : x) }));
    showToast(a.visible ? "비공개로 전환" : "공개로 전환");
  }, [showToast]);

  /* ── 클라이언트 필터 (신고/게시물/문의/공지/FAQ) ── */
  const filteredReports  = reports.items.filter(r => !searchReports  || r.postName?.toLowerCase().includes(searchReports.toLowerCase())  || r.reason?.toLowerCase().includes(searchReports.toLowerCase()));
  const filteredPosts    = posts.items.filter(p  => !searchPosts    || p.name?.toLowerCase().includes(searchPosts.toLowerCase())    || p.coupleLabel?.toLowerCase().includes(searchPosts.toLowerCase()));
  const filteredContacts = contacts.items.filter(c => !searchContacts || c.name?.toLowerCase().includes(searchContacts.toLowerCase()) || c.email?.toLowerCase().includes(searchContacts.toLowerCase()) || c.message?.toLowerCase().includes(searchContacts.toLowerCase()));
  const filteredAnn      = announces.items.filter(a => !searchAnn    || a.title?.toLowerCase().includes(searchAnn.toLowerCase())    || a.body?.toLowerCase().includes(searchAnn.toLowerCase()));
  const filteredFaqs     = faqs.filter(f => f.category === faqFilterCat && (!searchFaq || f.question.toLowerCase().includes(searchFaq.toLowerCase()) || f.answer.toLowerCase().includes(searchFaq.toLowerCase())));

  /* ── UI 상수 ── */
  const TABS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id:"reports",  icon:"🚨", label:"신고",  badge: badgeCounts.reports  },
    { id:"posts",    icon:"📋", label:"게시물", badge: badgeCounts.posts    },
    { id:"faq",      icon:"❓", label:"FAQ"                                  },
    { id:"contacts", icon:"📩", label:"문의",  badge: badgeCounts.contacts  },
    { id:"users",    icon:"👥", label:"유저"                                  },
    { id:"announce", icon:"📢", label:"공지"                                  },
    { id:"config",   icon:"⚙️", label:"설정"                                  },
  ];

  const inp: CSSProperties = { width:"100%", padding:"10px 12px", background:WARM, border:`1px solid ${BORDER}`, borderRadius:10, fontSize:13, fontFamily:"inherit", outline:"none", color:INK, boxSizing:"border-box" };
  const currentImgCount = annDraft.imgUrls.length + annFiles.length;

  return (
    <div style={{ minHeight:"100vh", background:BG, maxWidth:480, margin:"0 auto", fontFamily:"inherit", paddingBottom:40 }}>

      {/* ── 헤더 + 탭바 ── */}
      <div style={{ background:INK, padding:"14px 20px 0", position:"sticky", top:0, zIndex:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <button onClick={() => router.back()} style={{ background:"none", border:"none", cursor:"pointer", fontSize:24, color:"#fff", lineHeight:1 }}>‹</button>
          <p style={{ fontSize:17, fontWeight:700, color:"#fff", flex:1 }}>관리자 페이지</p>
          <div style={{ background:PURPLE, borderRadius:20, padding:"3px 10px" }}>
            <span style={{ fontSize:10, fontWeight:700, color:"#fff" }}>{myName} · ADMIN</span>
          </div>
        </div>
        <div style={{ display:"flex", overflowX:"auto" }}>
          {TABS.map(({ id, icon, label, badge }) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex:"0 0 auto", minWidth:52, padding:"8px 6px 10px", border:"none", borderBottom:`2px solid ${tab===id?ROSE:"transparent"}`, background:"none", color:tab===id?"#fff":"rgba(255,255,255,0.45)", fontSize:10, fontWeight:tab===id?700:400, cursor:"pointer", fontFamily:"inherit", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              <span style={{ fontSize:14 }}>{icon}</span>
              <span>{label}{badge !== undefined && badge > 0 ? ` (${badge})` : ""}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"16px 16px 0" }}>

        {/* ════ 신고 탭 ════ */}
        {tab === "reports" && (
          <>
            <SearchBar value={searchReports} onChange={setSearchReports} placeholder="식당명, 신고 사유 검색"/>
            {filteredReports.length === 0 ? (
              <EmptyBox icon="🎉" text={searchReports ? "검색 결과가 없어요" : "처리 대기 중인 신고가 없어요"}/>
            ) : filteredReports.map(r => (
              <div key={r.id} style={{ background:"#fff", borderRadius:14, marginBottom:10, padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:6, marginBottom:4 }}>
                      <Badge text={r.status==="pending"?"대기":"완료"} color={r.status==="pending"?RED:SAGE}/>
                    </div>
                    <p style={{ fontSize:14, fontWeight:600, color:INK }}>{r.postName}</p>
                    <p style={{ fontSize:12, color:MUTED, marginTop:2 }}>사유: {r.reason}</p>
                    <p style={{ fontSize:11, color:"#C0B8B0", marginTop:2 }}>{r.reportedAt?.slice(0, 10)}</p>
                  </div>
                  {r.status === "pending" && (
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      <button onClick={() => resolveReport(r.id)} style={btnStyle(SAGE)}>완료</button>
                      <button onClick={() => deletePost(r.postId, r.postName)} style={btnStyle(RED, true)}>삭제</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!searchReports && reports.hasMore && <LoadMoreBtn loading={reports.loading} onClick={loadMoreReports}/>}
          </>
        )}

        {/* ════ 게시물 탭 ════ */}
        {tab === "posts" && (
          <>
            <SearchBar value={searchPosts} onChange={setSearchPosts} placeholder="식당명, 작성자 검색"/>

            {filteredPosts.length === 0 ? (
              <EmptyBox icon="📋" text={searchPosts ? "검색 결과가 없어요" : "게시물이 없어요"}/>
            ) : filteredPosts.map(p => (
              <div key={p.id} style={{ background:"#fff", borderRadius:14, marginBottom:10, padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                {/* 상단: 이모지 + 정보 + 삭제 버튼 */}
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom: p.imgUrls?.length ? 10 : 0 }}>
                  <span style={{ fontSize:28, flexShrink:0 }}>{p.emoji}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:INK, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</p>
                    <p style={{ fontSize:11, color:MUTED, marginTop:2 }}>{p.coupleLabel} · ❤️ {p.likes} · {p.createdAt?.slice(0, 10)}</p>
                    {/* 이미지 개수 뱃지 */}
                    {p.imgUrls?.length > 0 && (
                      <p style={{ fontSize:10, color:BLUE, marginTop:3, fontWeight:600 }}>📷 사진 {p.imgUrls.length}장</p>
                    )}
                  </div>
                  <button onClick={() => deletePost(p.id, p.name)} style={{ ...btnStyle(RED, true), flexShrink:0 }}>삭제</button>
                </div>
                {/* 이미지 썸네일 */}
                {p.imgUrls?.length > 0 && (
                  <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
                    {p.imgUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`${p.name} 이미지 ${i + 1}`}
                        style={{ width:72, height:72, borderRadius:8, objectFit:"cover", flexShrink:0, border:`1px solid ${BORDER}`, cursor:"pointer" }}
                        onClick={() => window.open(url, "_blank")}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!searchPosts && posts.hasMore && <LoadMoreBtn loading={posts.loading} onClick={loadMorePosts}/>}
          </>
        )}

        {/* ════ FAQ 탭 ════ */}
        {tab === "faq" && (
          <>
            <div style={{ background:"#fff", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <p style={{ fontSize:13, fontWeight:700, color:INK, marginBottom:10 }}>{faqEdit ? "FAQ 수정" : "FAQ 추가"}</p>
              <p style={{ fontSize:11, color:MUTED, marginBottom:6 }}>카테고리</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                {FAQ_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setFaqCat(cat)} style={{ padding:"5px 12px", borderRadius:20, border:`1.5px solid ${faqCat===cat?SAGE:BORDER}`, background:faqCat===cat?SAGE+"20":WARM, color:faqCat===cat?SAGE:MUTED, fontSize:12, fontWeight:faqCat===cat?700:400, cursor:"pointer", fontFamily:"inherit" }}>
                    {cat}
                  </button>
                ))}
              </div>
              <input value={faqQ} onChange={e => setFaqQ(e.target.value)} placeholder="질문" style={{ ...inp, marginBottom:8 }}/>
              <textarea value={faqA} onChange={e => setFaqA(e.target.value)} placeholder="답변" rows={3} style={{ ...inp, resize:"none", marginBottom:10 }}/>
              <div style={{ display:"flex", gap:8 }}>
                {faqEdit && <button onClick={resetFaqForm} style={{ flex:1, padding:"10px 0", background:WARM, border:`1px solid ${BORDER}`, borderRadius:10, color:MUTED, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>취소</button>}
                <button onClick={saveFaq} style={{ flex:2, padding:"10px 0", background:faqQ&&faqA?SAGE:"#C0B8B0", border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:faqQ&&faqA?"pointer":"default", fontFamily:"inherit" }}>
                  {faqEdit ? "수정 완료" : "추가"}
                </button>
              </div>
            </div>
            <SearchBar value={searchFaq} onChange={setSearchFaq} placeholder="질문, 답변 내용 검색"/>
            <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:10, paddingBottom:2 }}>
              {FAQ_CATEGORIES.map(cat => {
                const count  = faqs.filter(f => f.category === cat).length;
                const active = faqFilterCat === cat;
                return (
                  <button key={cat} onClick={() => setFaqFilterCat(cat)} style={{ flexShrink:0, padding:"6px 12px", borderRadius:20, border:`1.5px solid ${active?ROSE:BORDER}`, background:active?ROSE+"15":"#fff", color:active?ROSE:MUTED, fontSize:12, fontWeight:active?700:400, cursor:"pointer", fontFamily:"inherit" }}>
                    {cat}{count > 0 ? ` ${count}` : ""}
                  </button>
                );
              })}
            </div>
            {filteredFaqs.length === 0 ? (
              <EmptyBox icon="❓" text={searchFaq ? "검색 결과가 없어요" : "등록된 FAQ가 없어요"}/>
            ) : filteredFaqs.map(f => (
              <div key={f.id} style={{ background:"#fff", borderRadius:14, marginBottom:10, padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ marginBottom:7 }}><Badge text={f.category || "미분류"} color={SAGE}/></div>
                <p style={{ fontSize:14, fontWeight:600, color:INK, marginBottom:4 }}>Q. {f.question}</p>
                <p style={{ fontSize:13, color:MUTED, lineHeight:1.6, marginBottom:10 }}>A. {f.answer}</p>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => { setFaqEdit(f); setFaqQ(f.question); setFaqA(f.answer); setFaqCat(f.category || FAQ_CATEGORIES[0]); window.scrollTo({ top:0, behavior:"smooth" }); }} style={btnStyle(SAGE)}>수정</button>
                  <button onClick={() => deleteFaq(f.id)} style={btnStyle(RED, true)}>삭제</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ════ 문의 탭 ════ */}
        {tab === "contacts" && (
          <>
            <SearchBar value={searchContacts} onChange={setSearchContacts} placeholder="이름, 이메일, 내용 검색"/>
            {filteredContacts.length === 0 ? (
              <EmptyBox icon="📩" text={searchContacts ? "검색 결과가 없어요" : "접수된 문의가 없어요"}/>
            ) : filteredContacts.map(c => (
              <div key={c.id} style={{ background:"#fff", borderRadius:14, marginBottom:10, padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:6, marginBottom:4 }}>
                      <Badge text={c.status==="pending"?"미처리":"처리완료"} color={c.status==="pending"?ROSE:SAGE}/>
                    </div>
                    <p style={{ fontSize:14, fontWeight:600, color:INK }}>{c.name}</p>
                    <p style={{ fontSize:12, color:MUTED, marginTop:2 }}>{c.email}</p>
                    <p style={{ fontSize:13, color:INK, marginTop:8, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{c.message}</p>
                    <p style={{ fontSize:11, color:"#C0B8B0", marginTop:6 }}>{c.createdAt?.slice(0, 10)}</p>
                  </div>
                  {c.status === "pending" && (
                    <button onClick={() => doneContact(c.id)} style={{ ...btnStyle(SAGE), flexShrink:0 }}>처리완료</button>
                  )}
                </div>
              </div>
            ))}
            {!searchContacts && contacts.hasMore && <LoadMoreBtn loading={contacts.loading} onClick={loadMoreContacts}/>}
          </>
        )}

        {/* ════ 유저 탭 ════ */}
        {tab === "users" && (
          <>
            {/* ★ 서버 prefix 검색 */}
            <SearchBar value={searchUsers} onChange={setSearchUsers} placeholder="이름 검색 (앞글자 기준)"/>
            {userSearchActive && searchUsers && (
              <p style={{ fontSize:11, color:MUTED, marginBottom:8 }}>'{searchUsers}'으로 시작하는 유저를 표시 중</p>
            )}
            {/* 유저 수 표시 */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <p style={{ fontSize:12, color:MUTED }}>
                {users.loading && users.items.length === 0 ? "불러오는 중..." : `${users.items.length}명 표시 중`}
              </p>
              <div style={{ display:"flex", gap:8 }}>
                <Badge text={`관리자 ${users.items.filter(u => u.role==="admin").length}`} color={PURPLE}/>
                <Badge text={`커플 ${users.items.filter(u => u.coupleId).length}`} color={ROSE}/>
              </div>
            </div>
            {users.loading && users.items.length === 0 ? (
              <div style={{ padding:"40px 0", textAlign:"center" }}>
                <div style={{ width:28, height:28, border:`3px solid ${BORDER}`, borderTopColor:ROSE, borderRadius:"50%", margin:"0 auto", animation:"spin 0.8s linear infinite" }}/>
              </div>
            ) : users.items.length === 0 ? (
              <EmptyBox icon="👥" text={searchUsers ? `'${searchUsers}'으로 시작하는 유저가 없어요` : "유저가 없어요"}/>
            ) : users.items.map(u => (
              <button key={u.id} onClick={() => setSelectedUser(u)} style={{ width:"100%", background:"#fff", borderRadius:14, marginBottom:10, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 1px 4px rgba(0,0,0,0.05)", border:"none", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:u.role==="admin"?PURPLE+"20":WARM, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                  {u.role === "admin" ? "👑" : "👤"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:600, color:INK }}>{u.name}</p>
                  <div style={{ display:"flex", gap:4, marginTop:3 }}>
                    <Badge text={u.role==="admin"?"관리자":"유저"} color={u.role==="admin"?PURPLE:MUTED}/>
                    {u.coupleId && <Badge text="커플" color={ROSE}/>}
                  </div>
                </div>
                <span style={{ color:BORDER, fontSize:18 }}>›</span>
              </button>
            ))}
            {users.hasMore && <LoadMoreBtn loading={users.loading} onClick={loadMoreUsers}/>}
          </>
        )}

        {/* ════ 공지 탭 ════ */}
        {tab === "announce" && (
          <>
            {!annForm && (
              <button onClick={() => setAnnForm(true)} style={{ width:"100%", padding:"12px 0", background:ROSE, border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginBottom:12 }}>
                + 새 공지 등록
              </button>
            )}
            {annForm && (
              <div style={{ background:"#fff", borderRadius:14, padding:"16px", marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <p style={{ fontSize:13, fontWeight:700, color:INK, marginBottom:12 }}>{annEdit ? "공지 수정" : "공지 등록"}</p>
                <p style={{ fontSize:11, color:MUTED, marginBottom:6 }}>유형</p>
                <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                  {(["notice", "event"] as const).map(t => (
                    <button key={t} onClick={() => setAnnDraft(p => ({ ...p, type: t }))} style={{ flex:1, padding:"8px 0", borderRadius:10, border:`1.5px solid ${annDraft.type===t?ROSE:BORDER}`, background:annDraft.type===t?ROSE+"15":WARM, color:annDraft.type===t?ROSE:MUTED, fontSize:12, fontWeight:annDraft.type===t?700:400, cursor:"pointer", fontFamily:"inherit" }}>
                      {t === "notice" ? "📢 공지" : "🎉 이벤트"}
                    </button>
                  ))}
                </div>
                <input value={annDraft.title} onChange={e => setAnnDraft(p => ({ ...p, title: e.target.value }))} placeholder="제목" style={{ ...inp, marginBottom:8 }}/>
                <textarea value={annDraft.body} onChange={e => setAnnDraft(p => ({ ...p, body: e.target.value }))} placeholder="내용" rows={4} style={{ ...inp, resize:"none", marginBottom:10 }}/>
                {annDraft.type === "event" && (
                  <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:11, color:MUTED, marginBottom:4 }}>시작일</p>
                      <input type="date" value={annDraft.startAt} onChange={e => setAnnDraft(p => ({ ...p, startAt: e.target.value }))} style={inp}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:11, color:MUTED, marginBottom:4 }}>종료일</p>
                      <input type="date" value={annDraft.endAt} onChange={e => setAnnDraft(p => ({ ...p, endAt: e.target.value }))} style={inp}/>
                    </div>
                  </div>
                )}
                <p style={{ fontSize:11, color:MUTED, marginBottom:8 }}>이미지 ({currentImgCount}/5)</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                  {annDraft.imgUrls.map(url => (
                    <div key={url} style={{ position:"relative", width:72, height:72 }}>
                      <img src={url} alt="" style={{ width:72, height:72, borderRadius:10, objectFit:"cover", border:`1px solid ${BORDER}` }}/>
                      <button onClick={() => markDelExisting(url)} style={{ position:"absolute", top:-6, right:-6, width:20, height:20, borderRadius:"50%", background:RED, border:"none", color:"#fff", fontSize:13, lineHeight:1, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                    </div>
                  ))}
                  {annPreviews.map((src, i) => (
                    <div key={i} style={{ position:"relative", width:72, height:72 }}>
                      <img src={src} alt="" style={{ width:72, height:72, borderRadius:10, objectFit:"cover", border:`1px solid ${BORDER}` }}/>
                      <button onClick={() => removeNewImage(i)} style={{ position:"absolute", top:-6, right:-6, width:20, height:20, borderRadius:"50%", background:RED, border:"none", color:"#fff", fontSize:13, lineHeight:1, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                    </div>
                  ))}
                  {currentImgCount < 5 && (
                    <button onClick={() => annFileRef.current?.click()} style={{ width:72, height:72, borderRadius:10, border:`1.5px dashed ${BORDER}`, background:WARM, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={MUTED} strokeWidth="2" strokeLinecap="round"/></svg>
                      <span style={{ fontSize:10, color:MUTED }}>추가</span>
                    </button>
                  )}
                </div>
                <input ref={annFileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={handleAnnImageChange}/>
                <div style={{ display:"flex", gap:16, marginBottom:14 }}>
                  <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:INK, cursor:"pointer" }}>
                    <input type="checkbox" checked={annDraft.pinned} onChange={e => setAnnDraft(p => ({ ...p, pinned: e.target.checked }))}/>상단 고정
                  </label>
                  <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:INK, cursor:"pointer" }}>
                    <input type="checkbox" checked={annDraft.visible} onChange={e => setAnnDraft(p => ({ ...p, visible: e.target.checked }))}/>즉시 공개
                  </label>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={resetAnnForm} style={{ flex:1, padding:"10px 0", background:WARM, border:`1px solid ${BORDER}`, borderRadius:10, color:MUTED, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>취소</button>
                  <button onClick={saveAnnounce} disabled={annUploading || !annDraft.title || !annDraft.body} style={{ flex:2, padding:"10px 0", background:annDraft.title&&annDraft.body&&!annUploading?ROSE:"#C0B8B0", border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:annDraft.title&&annDraft.body&&!annUploading?"pointer":"default", fontFamily:"inherit" }}>
                    {annUploading ? "업로드 중..." : annEdit ? "수정 완료" : "등록"}
                  </button>
                </div>
              </div>
            )}
            <SearchBar value={searchAnn} onChange={setSearchAnn} placeholder="제목, 내용 검색"/>
            {announces.loading && announces.items.length === 0 ? (
              <div style={{ padding:"40px 0", textAlign:"center" }}>
                <div style={{ width:28, height:28, border:`3px solid ${BORDER}`, borderTopColor:ROSE, borderRadius:"50%", margin:"0 auto", animation:"spin 0.8s linear infinite" }}/>
              </div>
            ) : filteredAnn.length === 0 ? (
              <EmptyBox icon="📢" text={searchAnn ? "검색 결과가 없어요" : "등록된 공지가 없어요"}/>
            ) : filteredAnn.map(a => (
              <div key={a.id} style={{ background:"#fff", borderRadius:14, marginBottom:10, padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", opacity:a.visible?1:0.55 }}>
                <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                  <Badge text={a.type==="notice"?"공지":"이벤트"} color={a.type==="notice"?ROSE:SAGE}/>
                  {a.pinned && <Badge text="고정" color={PURPLE}/>}
                  {!a.visible && <Badge text="비공개" color={MUTED}/>}
                  {a.startAt && a.endAt && <Badge text={`${a.startAt} ~ ${a.endAt}`} color={MUTED}/>}
                </div>
                <p style={{ fontSize:14, fontWeight:700, color:INK, marginBottom:4 }}>{a.title}</p>
                <p style={{ fontSize:12, color:MUTED, lineHeight:1.6, marginBottom:a.imgUrls?.length?8:10, whiteSpace:"pre-wrap" }}>{a.body}</p>
                {a.imgUrls?.length > 0 && (
                  <div style={{ display:"flex", gap:6, marginBottom:10, overflowX:"auto" }}>
                    {a.imgUrls.map((url, i) => <img key={i} src={url} alt="" style={{ width:56, height:56, borderRadius:8, objectFit:"cover", flexShrink:0, border:`1px solid ${BORDER}` }}/>)}
                  </div>
                )}
                <p style={{ fontSize:11, color:"#C0B8B0", marginBottom:10 }}>{a.createdAt?.slice(0, 10)}</p>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => { setAnnEdit(a); setAnnDraft({ title:a.title, body:a.body, type:a.type, pinned:a.pinned, visible:a.visible, startAt:a.startAt??"", endAt:a.endAt??"", imgUrls:a.imgUrls??[] }); setAnnForm(true); window.scrollTo({ top:0, behavior:"smooth" }); }} style={btnStyle(SAGE)}>수정</button>
                  <button onClick={() => toggleVisible(a)} style={btnStyle(PURPLE, true)}>{a.visible ? "비공개" : "공개"}</button>
                  <button onClick={() => deleteAnnounce(a)} style={btnStyle(RED, true)}>삭제</button>
                </div>
              </div>
            ))}
            {!searchAnn && announces.hasMore && <LoadMoreBtn loading={announces.loading} onClick={loadMoreAnn}/>}
          </>
        )}

        {/* ════ 설정 탭 ════ */}
        {tab === "config" && (
          <>
            <div style={{ background:"#fff", borderRadius:14, padding:"14px 16px", marginBottom:14, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <p style={{ fontSize:15, fontWeight:700, color:INK, marginBottom:12 }}>📣 전체 푸시 알림 발송</p>
              <input value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder="알림 제목" style={{ ...inp, marginBottom:8 }}/>
              <textarea value={pushBody} onChange={e => setPushBody(e.target.value)} placeholder="알림 내용" rows={3} style={{ ...inp, resize:"none", marginBottom:10 }}/>
              <button onClick={sendPushAll} disabled={pushLoading || !pushTitle.trim() || !pushBody.trim()} style={{ width:"100%", padding:"12px 0", background:pushTitle&&pushBody?ROSE:"#C0B8B0", border:"none", borderRadius:10, color:"#fff", fontSize:14, fontWeight:700, cursor:pushTitle&&pushBody?"pointer":"default", fontFamily:"inherit" }}>
                {pushLoading ? "발송 중..." : "전체 발송"}
              </button>
            </div>
            <div style={{ background:"#fff", borderRadius:14, padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <p style={{ fontSize:15, fontWeight:700, color:INK }}>앱 설정</p>
                {!cfgEdit && <button onClick={() => setCfgEdit(true)} style={btnStyle(SAGE)}>수정</button>}
              </div>
              {cfgEdit ? (
                <>
                  {(["appVersion", "supportEmail", "companyName", "termsDate"] as const).map(k => {
                    const labels: Record<string, string> = { appVersion:"앱 버전", supportEmail:"고객센터 이메일", companyName:"회사명 (약관)", termsDate:"약관 시행일" };
                    return (
                      <div key={k}>
                        <label style={{ fontSize:12, color:MUTED, display:"block", marginBottom:4 }}>{labels[k]}</label>
                        <input value={cfgDraft[k]} onChange={e => setCfgDraft(p => ({ ...p, [k]: e.target.value }))} style={{ ...inp, marginBottom:10 }}/>
                      </div>
                    );
                  })}
                  <label style={{ fontSize:12, color:MUTED, display:"block", marginBottom:4 }}>공지사항 (앱 내 배너)</label>
                  <textarea value={cfgDraft.notice} onChange={e => setCfgDraft(p => ({ ...p, notice: e.target.value }))} rows={3} style={{ ...inp, resize:"none", marginBottom:12 }}/>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => { setCfgEdit(false); setCfgDraft(config); }} style={{ flex:1, padding:"10px 0", background:WARM, border:`1px solid ${BORDER}`, borderRadius:10, color:MUTED, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>취소</button>
                    <button onClick={saveConfig} style={{ flex:2, padding:"10px 0", background:SAGE, border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>저장</button>
                  </div>
                </>
              ) : (
                <>
                  <Row label="앱 버전" value={config.appVersion || "미설정"}/>
                  <Row label="고객센터 이메일" value={config.supportEmail || "미설정"}/>
                  <Row label="공지사항" value={config.notice || "없음"}/>
                  <Row label="회사명" value={config.companyName || "미설정"}/>
                  <Row label="약관 시행일" value={config.termsDate || "미설정"}/>
                  <div style={{ marginTop:14, padding:"12px 14px", background:WARM, borderRadius:10, fontSize:12, color:MUTED, lineHeight:1.6 }}>💡 앱 버전은 배포 시 여기서 수동으로 업데이트하세요.</div>
                </>
              )}
            </div>
          </>
        )}

      </div>

      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onToast={showToast}/>}
      {toast && <Toast msg={toast}/>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
