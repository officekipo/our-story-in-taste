// ============================================================
//  admin/page.tsx  적용 경로: src/app/admin/page.tsx
//
//  추가 기능:
//    - 유저 탭: 전체 유저 목록, 클릭 시 상세 팝업
//      (관리자 등록/제거, 비밀번호 변경, 게시 글 목록, 신고 횟수, 마지막 로그인)
//    - 설정 탭: 전체 푸시 알림 발송 섹션 추가
// ============================================================
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter }     from "next/navigation";
import { useAuthStore }  from "@/store/authStore";
import { getAuth }       from "firebase/auth";
import {
  collection, query, orderBy, onSnapshot, where,
  doc, getDoc, updateDoc, deleteDoc, addDoc, getDocs,
  setDoc, getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

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

/* ── 탭 ── */
type Tab = "reports" | "posts" | "faq" | "contacts" | "users" | "config";

/* ── 인터페이스 ── */
interface FAQItem     { id: string; question: string; answer: string; order: number; }
interface ContactItem { id: string; name: string; email: string; message: string; createdAt: string; status: "pending" | "done"; }
interface ReportItem  { id: string; postId: string; postName: string; reason: string; reportedAt: string; status: "pending" | "resolved"; }
interface PostItem    { id: string; name: string; emoji: string; coupleLabel: string; likes: number; authorUid: string; }
interface ConfigItem  { appVersion: string; supportEmail: string; notice: string; }
interface UserItem    { id: string; name: string; role: "admin" | "user"; coupleId: string | null; profileImgUrl: string | null; }
interface UserPost    { id: string; name: string; emoji: string; likes: number; createdAt: string; }

/* ── Admin API 헬퍼 ── */
async function adminFetch(path: string, options: RequestInit = {}) {
  const token = await getAuth().currentUser?.getIdToken();
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

/* ── 토스트 ── */
function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "rgba(26,20,18,0.9)", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: "nowrap", pointerEvents: "none" }}>
      {msg}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   유저 상세 팝업
════════════════════════════════════════════════════════════ */
function UserDetailModal({
  user,
  onClose,
  onToast,
}: {
  user: UserItem;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const [authInfo,   setAuthInfo]   = useState<{ email: string | null; emailVerified: boolean; lastSignInTime: string | null; creationTime: string | null } | null>(null);
  const [coupleInfo,       setCoupleInfo]       = useState<{ partnerName: string; partnerUid: string; startDate: string } | null>(null);
  const [coupleInfoLoaded, setCoupleInfoLoaded] = useState(false);  // ★ 로딩 완료 여부
  const [posts,      setPosts]      = useState<UserPost[]>([]);
  const [reportTotal, setReportTotal] = useState(0);
  const [newPw,      setNewPw]      = useState("");
  const [pwLoading,  setPwLoading]  = useState(false);

  // Auth 정보 + 게시글 + 신고 수 로드
  useEffect(() => {
    // Auth 정보
    adminFetch(`/api/admin/user/${user.id}`)
      .then((r) => r.json())
      .then(setAuthInfo)
      .catch((e) => console.error("[Auth 정보 조회 오류]", e));

    // 커플 상대 정보
    if (user.coupleId) {
      getDoc(doc(db, "couples", user.coupleId)).then(async (coupleSnap) => {
        if (!coupleSnap.exists()) return;
        const coupleData = coupleSnap.data();
        const partnerUid = coupleData.user1Uid === user.id ? coupleData.user2Uid : coupleData.user1Uid;
        if (!partnerUid) return;
        const partnerSnap = await getDoc(doc(db, "users", partnerUid));
        if (partnerSnap.exists()) {
          setCoupleInfo({
            partnerName: partnerSnap.data().name ?? "이름 없음",
            partnerUid,
            startDate: coupleData.startDate ?? "—",
          });
        }
        setCoupleInfoLoaded(true);
      }).catch((e) => { console.error("[커플 정보 조회 오류]", e); setCoupleInfoLoaded(true); });
    } else {
      setCoupleInfoLoaded(true);  // 커플 없음도 로딩 완료로 처리
    }

    // 게시글 — orderBy 제거(복합 인덱스 불필요), 클라이언트에서 정렬
    getDocs(query(collection(db, "community"), where("authorUid", "==", user.id)))
      .then((snap) => {
        const list = snap.docs
          .map((d) => {
            const v = d.data();
            return { id: d.id, name: v.name ?? "", emoji: v.emoji ?? "🍽️", likes: v.likeCount ?? 0, createdAt: v.createdAt ?? "" };
          })
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setPosts(list);

        // 게시글 ID 로 신고 수 합산
        if (list.length === 0) return;
        const ids = list.map((p) => p.id);
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));

        Promise.all(
          chunks.map((chunk) =>
            getCountFromServer(query(collection(db, "community_reports"), where("postId", "in", chunk)))
          )
        ).then((snaps) => {
          setReportTotal(snaps.reduce((s, snap) => s + snap.data().count, 0));
        }).catch((e) => console.error("[신고 수 조회 오류]", e));
      })
      .catch((e) => console.error("[게시글 조회 오류]", e));
  }, [user.id]);

  // 역할 토글
  const toggleRole = async () => {
    const newRole = user.role === "admin" ? "user" : "admin";
    await updateDoc(doc(db, "users", user.id), { role: newRole });
    onToast(`${user.name}의 역할을 ${newRole === "admin" ? "관리자" : "일반 유저"}로 변경했어요`);
    onClose();
  };

  // 비밀번호 변경
  const changePw = async () => {
    if (newPw.length < 6) { onToast("비밀번호는 6자 이상이어야 해요"); return; }
    setPwLoading(true);
    try {
      const res = await adminFetch(`/api/admin/user/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPw }),
      });
      if (res.ok) {
        onToast("✅ 비밀번호를 변경했어요");
        setNewPw("");
      } else {
        const err = await res.json();
        onToast(`❌ ${err.error ?? "변경 실패"}`);
      }
    } finally {
      setPwLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    flex: 1, padding: "10px 12px", background: WARM,
    border: `1px solid ${BORDER}`, borderRadius: 10,
    fontSize: 13, fontFamily: "inherit", outline: "none", color: INK,
  };

  const formatDate = (str: string | null | undefined) => {
    if (!str) return "—";
    try { return new Date(str).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
    catch { return str; }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", padding: "20px 20px 40px" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: user.role === "admin" ? PURPLE + "20" : WARM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {user.role === "admin" ? "👑" : "👤"}
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: INK }}>{user.name}</p>
              <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                <Badge text={user.role === "admin" ? "관리자" : "유저"} color={user.role === "admin" ? PURPLE : SAGE} />
                {user.coupleId && <Badge text="커플 연동" color={ROSE} />}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: MUTED, cursor: "pointer" }}>×</button>
        </div>

        {/* 기본 정보 */}
        <Section title="계정 정보">
          <Row label="이메일" value={authInfo ? (authInfo.email ?? "소셜 로그인") : "로딩 중..."} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 13, color: MUTED }}>이메일 인증</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: authInfo?.emailVerified ? "#059669" : "#EF4444" }}>
                {authInfo == null ? "로딩 중..." : authInfo.emailVerified ? "✅ 인증됨" : "❌ 미인증"}
              </span>
              {authInfo && !authInfo.emailVerified && (
                <button
                  onClick={async () => {
                    const res = await adminFetch(`/api/admin/user/${user.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ emailVerified: true }),
                    });
                    if (res.ok) {
                      setAuthInfo((prev) => prev ? { ...prev, emailVerified: true } : prev);
                      onToast("✅ 이메일 인증을 완료 처리했어요");
                    } else {
                      onToast("❌ 인증 처리 실패");
                    }
                  }}
                  style={{ padding: "4px 10px", background: "#059669" + "1A", border: "1px solid #05966960", borderRadius: 8, color: "#059669", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  강제 인증
                </button>
              )}
            </div>
          </div>
          <Row label="가입일" value={formatDate(authInfo?.creationTime)} />
          <Row label="마지막 로그인" value={formatDate(authInfo?.lastSignInTime)} />
        </Section>

        {/* 역할 변경 */}
        <Section title="역할 관리">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
            <span style={{ fontSize: 13, color: MUTED }}>
              현재 역할: <strong style={{ color: user.role === "admin" ? PURPLE : INK }}>
                {user.role === "admin" ? "관리자" : "일반 유저"}
              </strong>
            </span>
            <button onClick={toggleRole}
              style={{ padding: "7px 14px", background: user.role === "admin" ? RED + "1A" : PURPLE + "1A", border: `1px solid ${user.role === "admin" ? RED : PURPLE}60`, borderRadius: 10, color: user.role === "admin" ? RED : PURPLE, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {user.role === "admin" ? "관리자 제거" : "관리자 등록"}
            </button>
          </div>
        </Section>

        {/* 비밀번호 변경 */}
        <Section title="비밀번호 변경">
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input
              type="password"
              placeholder="새 비밀번호 (6자 이상)"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              style={inp}
            />
            <button onClick={changePw} disabled={pwLoading}
              style={{ padding: "10px 14px", background: newPw.length >= 6 ? BLUE : "#C0B8B0", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 600, cursor: newPw.length >= 6 ? "pointer" : "default", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {pwLoading ? "변경 중..." : "변경"}
            </button>
          </div>
        </Section>

        {/* 커플 정보 */}
        <Section title="커플 정보">
          {!coupleInfoLoaded ? (
            <div style={{ padding: "10px 0" }}>
              <span style={{ fontSize: 13, color: MUTED }}>로딩 중...</span>
            </div>
          ) : coupleInfo ? (
            <>
              <Row label="교제 시작일" value={coupleInfo.startDate} />
              <Row label="파트너 이름" value={coupleInfo.partnerName} />
              <Row label="파트너 UID" value={coupleInfo.partnerUid.slice(0, 16) + "..."} />
            </>
          ) : (
            <div style={{ padding: "10px 0" }}>
              <span style={{ fontSize: 13, color: MUTED }}>커플 연동 없음</span>
            </div>
          )}
        </Section>

        {/* 활동 통계 */}
        <Section title="활동 통계">
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <StatCard label="게시 글" value={posts.length} color={SAGE} />
            <StatCard label="총 신고 횟수" value={reportTotal} color={reportTotal > 0 ? RED : MUTED} />
          </div>
        </Section>

        {/* 게시 글 목록 */}
        {posts.length > 0 && (
          <Section title="게시 글 목록">
            {posts.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 20 }}>{p.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{p.createdAt?.slice(0, 10)} · ❤️ {p.likes}</p>
                </div>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

/* ── 서브 컴포넌트 ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>{title}</p>
      <div style={{ background: WARM, borderRadius: 12, padding: "4px 14px" }}>{children}</div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1, background: "#fff", borderRadius: 10, padding: "12px", textAlign: "center", border: `1px solid ${BORDER}` }}>
      <p style={{ fontSize: 22, fontWeight: 700, color }}>{value}</p>
      <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{label}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   메인 컴포넌트
════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const router           = useRouter();
  const { role, myName } = useAuthStore();

  const [tab,     setTab]     = useState<Tab>("reports");
  const [toast,   setToast]   = useState<string | null>(null);

  // 탭별 데이터
  const [reports,  setReports]  = useState<ReportItem[]>([]);
  const [posts,    setPosts]    = useState<PostItem[]>([]);
  const [faqs,     setFaqs]     = useState<FAQItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [users,    setUsers]    = useState<UserItem[]>([]);
  const [config,   setConfig]   = useState<ConfigItem>({ appVersion: "1.0.0", supportEmail: "", notice: "" });

  const [badgeCounts, setBadgeCounts] = useState({ reports: 0, posts: 0, contacts: 0 });

  const [faqEdit, setFaqEdit] = useState<FAQItem | null>(null);
  const [faqQ,    setFaqQ]    = useState("");
  const [faqA,    setFaqA]    = useState("");

  const [cfgEdit,  setCfgEdit]  = useState(false);
  const [cfgDraft, setCfgDraft] = useState<ConfigItem>(config);

  // 전체 푸시 발송
  const [pushTitle,   setPushTitle]   = useState("");
  const [pushBody,    setPushBody]    = useState("");
  const [pushLoading, setPushLoading] = useState(false);

  // 유저 상세 팝업
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [userSearch,   setUserSearch]   = useState("");

  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => { if (role !== "admin") router.replace("/"); }, [role]);
  if (role !== "admin") return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  /* ── 배지 카운트 ── */
  useEffect(() => {
    (async () => {
      try {
        const [rSnap, pSnap, cSnap] = await Promise.all([
          getCountFromServer(query(collection(db, "community_reports"))),
          getCountFromServer(query(collection(db, "community"))),
          getCountFromServer(query(collection(db, "contacts"))),
        ]);
        setBadgeCounts({ reports: rSnap.data().count, posts: pSnap.data().count, contacts: cSnap.data().count });
      } catch (e) { console.warn("badge count error:", e); }
    })();
  }, []);

  /* ── 탭별 lazy 구독 ── */
  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }

    let unsub: (() => void) | null = null;

    switch (tab) {
      case "reports": {
        const q = query(collection(db, "community_reports"), orderBy("reportedAt", "desc"));
        unsub = onSnapshot(q, (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReportItem));
          setReports(data);
          setBadgeCounts((p) => ({ ...p, reports: data.filter((r) => r.status === "pending").length }));
        });
        break;
      }
      case "posts": {
        const q = query(collection(db, "community"), orderBy("createdAt", "desc"));
        unsub = onSnapshot(q, (snap) => {
          const data = snap.docs.map((d) => {
            const v = d.data();
            return { id: d.id, name: v.name ?? "", emoji: v.emoji ?? "🍽️", coupleLabel: v.showAuthorName === false ? "익명 커플" : (v.authorName ? `${v.authorName}의 추천` : "커플 추천"), likes: v.likeCount ?? 0, authorUid: v.authorUid ?? "" } as PostItem;
          });
          setPosts(data);
          setBadgeCounts((p) => ({ ...p, posts: data.length }));
        });
        break;
      }
      case "faq": {
        unsub = onSnapshot(query(collection(db, "faq"), orderBy("order", "asc")), (snap) => {
          setFaqs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FAQItem)));
        });
        break;
      }
      case "contacts": {
        const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
        unsub = onSnapshot(q, (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContactItem));
          setContacts(data);
          setBadgeCounts((p) => ({ ...p, contacts: data.filter((c) => c.status === "pending").length }));
        });
        break;
      }
      case "users": {
        unsub = onSnapshot(collection(db, "users"), (snap) => {
          setUsers(snap.docs.map((d) => {
            const v = d.data();
            return { id: d.id, name: v.name ?? "이름 없음", role: v.role ?? "user", coupleId: v.coupleId ?? null, profileImgUrl: v.profileImgUrl ?? null } as UserItem;
          }).sort((a, b) => {
            if (a.role === "admin" && b.role !== "admin") return -1;
            if (a.role !== "admin" && b.role === "admin") return 1;
            return a.name.localeCompare(b.name);
          }));
        });
        break;
      }
      case "config": {
        unsub = onSnapshot(doc(db, "config", "app"), (snap) => {
          if (snap.exists()) {
            const d = snap.data() as ConfigItem;
            setConfig(d);
            setCfgDraft(d);
          }
        });
        break;
      }
    }

    if (unsub) unsubRef.current = unsub;
    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, [tab]);

  /* ── 게시물 삭제 ── */
  const deletePost = useCallback(async (id: string, name: string) => {
    await deleteDoc(doc(db, "community", id));
    showToast(`"${name}" 게시물을 삭제했어요`);
  }, []);

  /* ── 신고 처리 ── */
  const resolveReport = useCallback(async (id: string) => {
    await updateDoc(doc(db, "community_reports", id), { status: "resolved" });
    showToast("신고를 처리 완료했어요");
  }, []);

  /* ── FAQ ── */
  const saveFaq = useCallback(async () => {
    if (!faqQ.trim() || !faqA.trim()) return;
    if (faqEdit) {
      await updateDoc(doc(db, "faq", faqEdit.id), { question: faqQ, answer: faqA });
      showToast("FAQ를 수정했어요");
    } else {
      await addDoc(collection(db, "faq"), { question: faqQ, answer: faqA, order: faqs.length });
      showToast("FAQ를 추가했어요");
    }
    setFaqEdit(null); setFaqQ(""); setFaqA("");
  }, [faqQ, faqA, faqEdit, faqs.length]);

  const deleteFaq = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "faq", id));
    showToast("FAQ를 삭제했어요");
  }, []);

  /* ── 문의 ── */
  const doneContact = useCallback(async (id: string) => {
    await updateDoc(doc(db, "contacts", id), { status: "done" });
    showToast("문의를 처리 완료했어요");
  }, []);

  /* ── Config 저장 ── */
  const saveConfig = useCallback(async () => {
    await setDoc(doc(db, "config", "app"), cfgDraft, { merge: true });
    setCfgEdit(false);
    showToast("설정을 저장했어요");
  }, [cfgDraft]);

  /* ── 전체 푸시 발송 ── */
  const sendPushAll = async () => {
    if (!pushTitle.trim() || !pushBody.trim()) return;
    setPushLoading(true);
    try {
      const res = await adminFetch("/api/notify-all", {
        method: "POST",
        body: JSON.stringify({ title: pushTitle, body: pushBody }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast(`✅ ${json.sent}명에게 발송했어요`);
        setPushTitle(""); setPushBody("");
      } else {
        showToast(`❌ ${json.error ?? "발송 실패"}`);
      }
    } finally {
      setPushLoading(false);
    }
  };

  /* ── 탭 정의 ── */
  const TABS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: "reports",  icon: "🚨", label: "신고",   badge: badgeCounts.reports },
    { id: "posts",    icon: "📋", label: "게시물", badge: badgeCounts.posts },
    { id: "faq",      icon: "❓", label: "FAQ" },
    { id: "contacts", icon: "📩", label: "문의",   badge: badgeCounts.contacts },
    { id: "users",    icon: "👥", label: "유저" },
    { id: "config",   icon: "⚙️", label: "설정" },
  ];

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", background: WARM,
    border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13,
    fontFamily: "inherit", outline: "none", color: INK, boxSizing: "border-box",
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", maxWidth: 480, margin: "0 auto", fontFamily: "inherit", paddingBottom: 40 }}>

      {/* 헤더 */}
      <div style={{ background: INK, padding: "14px 20px 0", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: "#fff", lineHeight: 1 }}>‹</button>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", flex: 1 }}>관리자 페이지</p>
          <div style={{ background: PURPLE, borderRadius: 20, padding: "3px 10px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{myName} · ADMIN</span>
          </div>
        </div>
        {/* 탭 — 6개 작은 크기 */}
        <div style={{ display: "flex", overflowX: "auto" }}>
          {TABS.map(({ id, icon, label, badge }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ flex: "0 0 auto", minWidth: 60, padding: "8px 6px 10px", border: "none", borderBottom: `2px solid ${tab === id ? ROSE : "transparent"}`, background: "none", color: tab === id ? "#fff" : "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: tab === id ? 700 : 400, cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span>{label}{badge !== undefined && badge > 0 ? ` (${badge})` : ""}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>

        {/* ══ 신고 탭 ══ */}
        {tab === "reports" && (
          reports.length === 0 ? <EmptyBox icon="🎉" text="처리 대기 중인 신고가 없어요" /> :
          reports.map((r) => (
            <div key={r.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 4 }}><Badge text={r.status === "pending" ? "대기" : "완료"} color={r.status === "pending" ? RED : SAGE} /></div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: INK }}>{r.postName}</p>
                  <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>사유: {r.reason}</p>
                  <p style={{ fontSize: 11, color: "#C0B8B0", marginTop: 2 }}>{r.reportedAt?.slice(0, 10)}</p>
                </div>
                {r.status === "pending" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={() => resolveReport(r.id)} style={{ ...btnStyle(SAGE) }}>완료</button>
                    <button onClick={async () => { await deleteDoc(doc(db, "community", r.postId)); await resolveReport(r.id); showToast("게시물을 삭제했어요"); }} style={{ ...btnStyle(RED, true) }}>삭제</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* ══ 게시물 탭 ══ */}
        {tab === "posts" && (
          posts.length === 0 ? <EmptyBox icon="📋" text="게시물이 없어요" /> :
          posts.map((p) => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <span style={{ fontSize: 28 }}>{p.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                <p style={{ fontSize: 11, color: MUTED }}>{p.coupleLabel} · ❤️ {p.likes}</p>
              </div>
              <button onClick={() => deletePost(p.id, p.name)} style={{ ...btnStyle(RED, true), flexShrink: 0 }}>삭제</button>
            </div>
          ))
        )}

        {/* ══ FAQ 탭 ══ */}
        {tab === "faq" && (
          <>
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 10 }}>{faqEdit ? "FAQ 수정" : "FAQ 추가"}</p>
              <input value={faqQ} onChange={(e) => setFaqQ(e.target.value)} placeholder="질문" style={{ ...inp, marginBottom: 8 }} />
              <textarea value={faqA} onChange={(e) => setFaqA(e.target.value)} placeholder="답변" rows={3} style={{ ...inp, resize: "none", marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8 }}>
                {faqEdit && <button onClick={() => { setFaqEdit(null); setFaqQ(""); setFaqA(""); }} style={{ flex: 1, padding: "10px 0", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>취소</button>}
                <button onClick={saveFaq} style={{ flex: 2, padding: "10px 0", background: faqQ && faqA ? SAGE : "#C0B8B0", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{faqEdit ? "수정 완료" : "추가"}</button>
              </div>
            </div>
            {faqs.length === 0 ? <EmptyBox icon="❓" text="등록된 FAQ가 없어요" /> :
              faqs.map((f) => (
                <div key={f.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 4 }}>Q. {f.question}</p>
                  <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 10 }}>A. {f.answer}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setFaqEdit(f); setFaqQ(f.question); setFaqA(f.answer); }} style={{ ...btnStyle(SAGE) }}>수정</button>
                    <button onClick={() => deleteFaq(f.id)} style={{ ...btnStyle(RED, true) }}>삭제</button>
                  </div>
                </div>
              ))
            }
          </>
        )}

        {/* ══ 문의 탭 ══ */}
        {tab === "contacts" && (
          contacts.length === 0 ? <EmptyBox icon="📩" text="접수된 문의가 없어요" /> :
          contacts.map((c) => (
            <div key={c.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 4 }}><Badge text={c.status === "pending" ? "미처리" : "처리완료"} color={c.status === "pending" ? ROSE : SAGE} /></div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: INK }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{c.email}</p>
                  <p style={{ fontSize: 13, color: INK, marginTop: 8, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{c.message}</p>
                  <p style={{ fontSize: 11, color: "#C0B8B0", marginTop: 6 }}>{c.createdAt?.slice(0, 10)}</p>
                </div>
                {c.status === "pending" && <button onClick={() => doneContact(c.id)} style={{ ...btnStyle(SAGE), flexShrink: 0 }}>처리완료</button>}
              </div>
            </div>
          ))
        )}

        {/* ══ 유저 탭 ══ */}
        {tab === "users" && (
          <>
            <input
              placeholder="이름 검색"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ ...inp, marginBottom: 12 }}
            />
            {filteredUsers.length === 0 ? <EmptyBox icon="👥" text="유저가 없어요" /> :
              filteredUsers.map((u) => (
                <button key={u.id} onClick={() => setSelectedUser(u)}
                  style={{ width: "100%", background: "#fff", borderRadius: 14, marginBottom: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: u.role === "admin" ? PURPLE + "20" : WARM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {u.role === "admin" ? "👑" : "👤"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: INK }}>{u.name}</p>
                    <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                      <Badge text={u.role === "admin" ? "관리자" : "유저"} color={u.role === "admin" ? PURPLE : MUTED} />
                      {u.coupleId && <Badge text="커플" color={ROSE} />}
                    </div>
                  </div>
                  <span style={{ color: BORDER, fontSize: 18 }}>›</span>
                </button>
              ))
            }
          </>
        )}

        {/* ══ 설정 탭 ══ */}
        {tab === "config" && (
          <>
            {/* 전체 푸시 발송 */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 12 }}>📣 전체 푸시 알림 발송</p>
              <input value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} placeholder="알림 제목" style={{ ...inp, marginBottom: 8 }} />
              <textarea value={pushBody} onChange={(e) => setPushBody(e.target.value)} placeholder="알림 내용" rows={3} style={{ ...inp, resize: "none", marginBottom: 10 }} />
              <button onClick={sendPushAll} disabled={pushLoading || !pushTitle.trim() || !pushBody.trim()}
                style={{ width: "100%", padding: "12px 0", background: pushTitle && pushBody ? ROSE : "#C0B8B0", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: pushTitle && pushBody ? "pointer" : "default", fontFamily: "inherit" }}>
                {pushLoading ? "발송 중..." : "전체 발송"}
              </button>
            </div>

            {/* 앱 설정 */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: INK }}>앱 설정</p>
                {!cfgEdit && <button onClick={() => setCfgEdit(true)} style={{ ...btnStyle(SAGE) }}>수정</button>}
              </div>
              {cfgEdit ? (
                <>
                  <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 4 }}>앱 버전</label>
                  <input value={cfgDraft.appVersion} onChange={(e) => setCfgDraft((p) => ({ ...p, appVersion: e.target.value }))} style={{ ...inp, marginBottom: 10 }} />
                  <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 4 }}>고객센터 이메일</label>
                  <input value={cfgDraft.supportEmail} onChange={(e) => setCfgDraft((p) => ({ ...p, supportEmail: e.target.value }))} style={{ ...inp, marginBottom: 10 }} />
                  <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 4 }}>공지사항 (앱 내 표시)</label>
                  <textarea value={cfgDraft.notice} onChange={(e) => setCfgDraft((p) => ({ ...p, notice: e.target.value }))} rows={3} style={{ ...inp, resize: "none", marginBottom: 12 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setCfgEdit(false); setCfgDraft(config); }} style={{ flex: 1, padding: "10px 0", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                    <button onClick={saveConfig} style={{ flex: 2, padding: "10px 0", background: SAGE, border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
                  </div>
                </>
              ) : (
                <>
                  <Row label="앱 버전"        value={config.appVersion  || "미설정"} />
                  <Row label="고객센터 이메일" value={config.supportEmail || "미설정"} />
                  <Row label="공지사항"        value={config.notice       || "없음"} />
                  <div style={{ marginTop: 14, padding: "12px 14px", background: WARM, borderRadius: 10, fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
                    💡 앱 버전은 배포 시 여기서 수동으로 업데이트하세요.<br />
                    고객센터 페이지에서 이 이메일로 연결됩니다.
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* 유저 상세 팝업 */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToast={showToast}
        />
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}

/* ── 공통 UI 컴포넌트 ── */
function EmptyBox({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "40px 20px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14, color: "#8A8078" }}>{text}</p>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ background: color + "1A", borderRadius: 20, padding: "2px 8px", display: "inline-block" }}>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{text}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F0EBE3" }}>
      <span style={{ fontSize: 13, color: "#8A8078" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1A1412", fontWeight: 500, maxWidth: "60%", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function btnStyle(color: string, outline?: boolean): React.CSSProperties {
  return {
    padding: "6px 14px",
    background: outline ? color + "1A" : color,
    border: outline ? `1px solid ${color}60` : "none",
    borderRadius: 10,
    color: outline ? color : "#fff",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}
