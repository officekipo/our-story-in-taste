// ============================================================
//  admin/page.tsx  적용 경로: src/app/admin/page.tsx
//
//  Fix: INTERNAL ASSERTION FAILED 오류 해결
//    - 5개 onSnapshot 동시 구독 → 탭별 lazy 구독 패턴으로 변경
//    - 탭 활성화 시 구독 시작, 탭 비활성화(또는 언마운트) 시 unsubscribe
//    - 배지(신고 수/게시물 수) 유지를 위해 최초 1회 getDocs로 카운트만 조회
// ============================================================
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter }     from "next/navigation";
import { useAuthStore }  from "@/store/authStore";
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, deleteDoc, addDoc, getDocs,
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

/* ── 탭 ── */
type Tab = "reports" | "posts" | "faq" | "contacts" | "config";

/* ── 인터페이스 ── */
interface FAQItem     { id: string; question: string; answer: string; order: number; }
interface ContactItem { id: string; name: string; email: string; message: string; createdAt: string; status: "pending" | "done"; }
interface ReportItem  { id: string; postId: string; postName: string; reason: string; reportedAt: string; status: "pending" | "resolved"; }
interface PostItem    { id: string; name: string; emoji: string; coupleLabel: string; likes: number; authorUid: string; }
interface ConfigItem  { appVersion: string; supportEmail: string; notice: string; }

/* ── 토스트 ── */
function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "rgba(26,20,18,0.9)", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: "nowrap", pointerEvents: "none" }}>
      {msg}
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
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
  const [config,   setConfig]   = useState<ConfigItem>({ appVersion: "1.0.0", supportEmail: "", notice: "" });

  // 배지용 카운트 (탭 미진입 시에도 표시)
  const [badgeCounts, setBadgeCounts] = useState({ reports: 0, posts: 0, contacts: 0 });

  // FAQ 편집
  const [faqEdit, setFaqEdit] = useState<FAQItem | null>(null);
  const [faqQ,    setFaqQ]    = useState("");
  const [faqA,    setFaqA]    = useState("");

  // Config 편집
  const [cfgEdit,  setCfgEdit]  = useState(false);
  const [cfgDraft, setCfgDraft] = useState<ConfigItem>(config);

  // 현재 활성 구독 해제 함수 보관
  const unsubRef = useRef<(() => void) | null>(null);

  /* ── role 체크 ── */
  useEffect(() => { if (role !== "admin") router.replace("/"); }, [role]);
  if (role !== "admin") return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  /* ── 배지용 카운트: 최초 1회만 getDocs로 조회 ── */
  useEffect(() => {
    (async () => {
      try {
        const [rSnap, pSnap, cSnap] = await Promise.all([
          getCountFromServer(query(collection(db, "community_reports"))),
          getCountFromServer(query(collection(db, "community"))),
          getCountFromServer(query(collection(db, "contacts"))),
        ]);
        setBadgeCounts({
          reports:  rSnap.data().count,
          posts:    pSnap.data().count,
          contacts: cSnap.data().count,
        });
      } catch (e) {
        // 카운트 실패 시 무시 (배지만 안 보임)
        console.warn("badge count error:", e);
      }
    })();
  }, []);

  /* ── 탭별 lazy 구독 ── */
  useEffect(() => {
    // 이전 탭 구독 해제
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    let unsub: (() => void) | null = null;

    switch (tab) {

      case "reports": {
        const q = query(collection(db, "community_reports"), orderBy("reportedAt", "desc"));
        unsub = onSnapshot(q, (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReportItem));
          setReports(data);
          setBadgeCounts((prev) => ({ ...prev, reports: data.filter((r) => r.status === "pending").length }));
        });
        break;
      }

      case "posts": {
        const q = query(collection(db, "community"), orderBy("createdAt", "desc"));
        unsub = onSnapshot(q, (snap) => {
          const data = snap.docs.map((d) => {
            const v = d.data();
            return {
              id:          d.id,
              name:        v.name ?? v.restaurantName ?? "",
              emoji:       v.emoji ?? "🍽️",
              coupleLabel: v.showAuthorName === false ? "익명 커플" : (v.authorName ? `${v.authorName}의 추천` : "커플 추천"),
              likes:       v.likeCount ?? 0,
              authorUid:   v.authorUid ?? "",
            } as PostItem;
          });
          setPosts(data);
          setBadgeCounts((prev) => ({ ...prev, posts: data.length }));
        });
        break;
      }

      case "faq": {
        const q = query(collection(db, "faq"), orderBy("order", "asc"));
        unsub = onSnapshot(q, (snap) => {
          setFaqs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FAQItem)));
        });
        break;
      }

      case "contacts": {
        const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
        unsub = onSnapshot(q, (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContactItem));
          setContacts(data);
          setBadgeCounts((prev) => ({ ...prev, contacts: data.filter((c) => c.status === "pending").length }));
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

    // 탭 변경 or 언마운트 시 구독 해제
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [tab]); // ← tab 변경 시에만 재실행

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

  /* ── FAQ 저장 ── */
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

  /* ── FAQ 삭제 ── */
  const deleteFaq = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "faq", id));
    showToast("FAQ를 삭제했어요");
  }, []);

  /* ── 문의 처리 완료 ── */
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

  /* ── 탭 배지 계산 ── */
  const TABS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: "reports",  icon: "🚨", label: "신고",   badge: badgeCounts.reports },
    { id: "posts",    icon: "📋", label: "게시물", badge: badgeCounts.posts },
    { id: "faq",      icon: "❓", label: "FAQ" },
    { id: "contacts", icon: "📩", label: "문의",   badge: badgeCounts.contacts },
    { id: "config",   icon: "⚙️", label: "설정" },
  ];

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", background: WARM,
    border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13,
    fontFamily: "inherit", outline: "none", color: INK, boxSizing: "border-box",
  };

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
        <div style={{ display: "flex" }}>
          {TABS.map(({ id, icon, label, badge }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ flex: 1, padding: "8px 2px 10px", border: "none", borderBottom: `2px solid ${tab === id ? ROSE : "transparent"}`, background: "none", color: tab === id ? "#fff" : "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: tab === id ? 700 : 400, cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, position: "relative" }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span>{label}{badge !== undefined && badge > 0 ? ` (${badge})` : ""}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>

        {/* ══ 신고 탭 ══ */}
        {tab === "reports" && (
          reports.length === 0
            ? <EmptyBox icon="🎉" text="처리 대기 중인 신고가 없어요" />
            : reports.map((r) => (
              <div key={r.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      <Badge text={r.status === "pending" ? "대기" : "완료"} color={r.status === "pending" ? RED : SAGE} />
                    </div>
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
          posts.length === 0
            ? <EmptyBox icon="📋" text="게시물이 없어요" />
            : posts.map((p) => (
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
            {/* 추가/수정 폼 */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 10 }}>
                {faqEdit ? "FAQ 수정" : "FAQ 추가"}
              </p>
              <input value={faqQ} onChange={(e) => setFaqQ(e.target.value)} placeholder="질문" style={{ ...inp, marginBottom: 8 }} />
              <textarea value={faqA} onChange={(e) => setFaqA(e.target.value)} placeholder="답변" rows={3} style={{ ...inp, resize: "none", marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8 }}>
                {faqEdit && (
                  <button onClick={() => { setFaqEdit(null); setFaqQ(""); setFaqA(""); }}
                    style={{ flex: 1, padding: "10px 0", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    취소
                  </button>
                )}
                <button onClick={saveFaq} style={{ flex: 2, padding: "10px 0", background: faqQ && faqA ? SAGE : "#C0B8B0", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {faqEdit ? "수정 완료" : "추가"}
                </button>
              </div>
            </div>

            {faqs.length === 0
              ? <EmptyBox icon="❓" text="등록된 FAQ가 없어요" />
              : faqs.map((f) => (
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
          contacts.length === 0
            ? <EmptyBox icon="📩" text="접수된 문의가 없어요" />
            : contacts.map((c) => (
              <div key={c.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      <Badge text={c.status === "pending" ? "미처리" : "처리완료"} color={c.status === "pending" ? ROSE : SAGE} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: INK }}>{c.name}</p>
                    <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{c.email}</p>
                    <p style={{ fontSize: 13, color: INK, marginTop: 8, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{c.message}</p>
                    <p style={{ fontSize: 11, color: "#C0B8B0", marginTop: 6 }}>{c.createdAt?.slice(0, 10)}</p>
                  </div>
                  {c.status === "pending" && (
                    <button onClick={() => doneContact(c.id)} style={{ ...btnStyle(SAGE), flexShrink: 0 }}>처리완료</button>
                  )}
                </div>
              </div>
            ))
        )}

        {/* ══ 설정 탭 ══ */}
        {tab === "config" && (
          <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: INK }}>앱 설정</p>
              {!cfgEdit && (
                <button onClick={() => setCfgEdit(true)} style={{ ...btnStyle(SAGE) }}>수정</button>
              )}
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
        )}
      </div>

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
