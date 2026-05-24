// src/app/settings/support/page.tsx
"use client";

import { useState, useEffect }         from "react";
import { useRouter }                   from "next/navigation";
import { useAuthStore }                from "@/store/authStore";
import { auth }                        from "@/lib/firebase/config";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, doc, onSnapshot as docSnap,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const CREAM   = "#F0EBE3";

interface FAQItem { id: string; question: string; answer: string; order: number; category: string; }

/* ── FAQ 카테고리 (admin/page.tsx 와 동일하게 유지) ── */
const FAQ_CATEGORIES = ["커플 연동", "맛집 기록", "위시리스트", "지도·통계", "커뮤니티", "알림", "앱·계정"];

/* ── 1:1 문의 유형 (FAQ 카테고리와 별개) ── */
const CONTACT_CATEGORIES = ["앱 오류/버그", "기능 문의", "계정 문제", "데이터 내보내기 요청", "기타"];

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "rgba(26,20,18,0.9)", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: "nowrap", pointerEvents: "none" }}>
      {msg}
    </div>
  );
}

export default function SupportPage() {
  const router             = useRouter();
  const { myName, myUid }  = useAuthStore();

  const [faqs,         setFaqs]         = useState<FAQItem[]>([]);
  const [supportEmail, setSupportEmail] = useState("");
  const [appVersion,   setAppVersion]   = useState("1.0.0");
  const [notice,       setNotice]       = useState("");

  const [openFaq,   setOpenFaq]   = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState(FAQ_CATEGORIES[0]); // 기본값: 첫 번째 카테고리
  const [category,  setCategory]  = useState("");
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [content,   setContent]   = useState("");
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [toast,     setToast]     = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    const unsub = docSnap(doc(db, "config", "app"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setSupportEmail(d.supportEmail ?? "");
        setAppVersion(d.appVersion    ?? "1.0.0");
        setNotice(d.notice            ?? "");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "faq"), orderBy("order", "asc"));
    return onSnapshot(q, (snap) => {
      setFaqs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FAQItem)));
    });
  }, []);

  useEffect(() => { if (myName) setName(myName); }, [myName]);

  useEffect(() => {
    const currentEmail = auth.currentUser?.email ?? "";
    if (currentEmail) setEmail(currentEmail);
  }, [myUid]);

  const handleSend = async () => {
    if (!name.trim())    { showToast("이름을 입력해주세요"); return; }
    if (!email.trim())   { showToast("이메일을 입력해주세요"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast("올바른 이메일 형식이 아니에요"); return; }
    if (!category)       { showToast("문의 유형을 선택해주세요"); return; }
    if (!content.trim()) { showToast("문의 내용을 입력해주세요"); return; }
    setSending(true);
    try {
      await addDoc(collection(db, "contacts"), {
        uid: myUid || null, name: name.trim(), email: email.trim(),
        category, message: content.trim(), appVersion, status: "pending",
        createdAt: new Date().toISOString(),
      });
      setSent(true);
    } catch (e) {
      console.error("문의 전송 오류:", e);
      showToast("전송 실패. 다시 시도해주세요.");
    } finally { setSending(false); }
  };

  const canSend = !!name.trim() && !!email.trim() && !!category && !!content.trim() && !sending;

  /* 선택된 카테고리의 FAQ만 표시 */
  const filteredFaqs = faqs.filter((f) => f.category === activeCat);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", maxWidth: 480, margin: "0 auto", fontFamily: "inherit", paddingBottom: 48 }}>

      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: MUTED, lineHeight: 1, padding: "0 4px 0 0" }}>‹</button>
        <p style={{ fontSize: 17, fontWeight: 700, color: INK }}>고객센터</p>
      </div>

      {/* 공지사항 */}
      {notice ? (
        <div style={{ margin: "12px 16px 0", padding: "12px 16px", background: "#FFF8E7", borderRadius: 12, border: "1px solid #F5E0A0", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📢</span>
          <p style={{ fontSize: 13, color: "#7A5C00", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{notice}</p>
        </div>
      ) : null}

      {/* 상단 카드 */}
      <div style={{ margin: "16px 16px 0", background: `linear-gradient(135deg, ${ROSE_LT}, ${CREAM})`, borderRadius: 20, padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
        <p style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 4 }}>무엇이 궁금하세요?</p>
        <p style={{ fontSize: 13, color: MUTED }}>자주 묻는 질문을 먼저 확인하거나<br />1:1 문의를 남겨주세요</p>
        {supportEmail ? (
          <div style={{ marginTop: 14, background: "rgba(255,255,255,0.7)", borderRadius: 12, padding: "10px 16px", display: "inline-block" }}>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>이메일 문의</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: ROSE }}>{supportEmail}</p>
          </div>
        ) : null}
      </div>

      {/* 앱 버전 */}
      <div style={{ margin: "12px 16px 0", background: "#fff", borderRadius: 14, padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: 13, color: MUTED }}>앱 버전</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: INK }}>v{appVersion}</p>
      </div>

      {/* 데이터 내보내기 안내 */}
      <div style={{ margin: "20px 16px 0" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>데이터 내보내기</p>
        <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F0EBE3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📤</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>내 기록 내보내기</p>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>방문 기록·위시리스트를 파일로 받고 싶으시면 아래 1:1 문의를 이용해주세요. 문의 유형에서 <strong style={{ color: INK }}>"데이터 내보내기 요청"</strong>을 선택하시면 빠르게 처리해드려요.</p>
            </div>
          </div>
          <div style={{ background: "#F5F0EB", borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
              📋 제공 형식: CSV (Excel 호환)<br />
              ⏱️ 처리 기간: 영업일 기준 3일 이내<br />
              📧 답변 이메일로 파일 전달
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ margin: "20px 16px 0" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>자주 묻는 질문</p>

        {/* 카테고리 탭 (전체 없음, 기본: 커플 연동) */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
          {FAQ_CATEGORIES.map((cat) => {
            const active = activeCat === cat;
            const count  = faqs.filter((f) => f.category === cat).length;
            if (count === 0) return null; // 항목 없는 카테고리 숨김
            return (
              <button key={cat} onClick={() => { setActiveCat(cat); setOpenFaq(null); }}
                style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${active ? ROSE : BORDER}`, background: active ? ROSE_LT : "#fff", color: active ? ROSE : MUTED, fontSize: 12, fontWeight: active ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* FAQ 목록 */}
        {filteredFaqs.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px 20px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>❓</div>
            <p style={{ fontSize: 14, color: MUTED }}>등록된 FAQ가 없어요</p>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            {filteredFaqs.map((item, i) => (
              <div key={item.id} style={{ borderBottom: i < filteredFaqs.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: INK, flex: 1, marginRight: 12 }}>Q. {item.question}</p>
                  <span style={{ fontSize: 16, color: openFaq === item.id ? ROSE : "#C0B8B0", flexShrink: 0, display: "block", transition: "transform 0.2s", transform: openFaq === item.id ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                </button>
                {openFaq === item.id && (
                  <div style={{ padding: "0 16px 14px" }}>
                    <div style={{ background: WARM, borderRadius: 10, padding: "12px 14px" }}>
                      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>A. {item.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1:1 문의 폼 */}
      <div style={{ margin: "20px 16px 0" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>1:1 문의하기</p>

        {sent ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px 20px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 8 }}>문의가 접수됐어요</p>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
              {supportEmail ? `${supportEmail}로 빠르게 답변 드릴게요.` : "빠르게 답변 드릴게요."}
            </p>
            <button onClick={() => { setSent(false); setCategory(""); setContent(""); }}
              style={{ marginTop: 20, padding: "10px 24px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              새 문의하기
            </button>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>

            <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>이름 *</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동"
              style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 14 }} />

            <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>답변받을 이메일 *</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com"
              style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 4 }} />
            {!auth.currentUser?.email && (
              <p style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>답변받으실 이메일을 직접 입력해주세요.</p>
            )}
            {auth.currentUser?.email && (
              <p style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>가입한 이메일로 자동 입력됐어요. 다른 주소로 받으시려면 수정하세요.</p>
            )}

            <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 10 }}>문의 유형 *</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {CONTACT_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${category === c ? ROSE : BORDER}`, background: category === c ? ROSE_LT : WARM, color: category === c ? ROSE : MUTED, fontSize: 13, fontWeight: category === c ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                  {c}
                </button>
              ))}
            </div>

            <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>문의 내용 *</p>
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              placeholder={`불편하신 점이나 문의 사항을 자세히 작성해주세요.\n\n앱 버전: v${appVersion}\n닉네임: ${myName}`}
              rows={6}
              style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6, marginBottom: 16 }} />

            {supportEmail && (
              <p style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>
                답변은 <strong>{supportEmail}</strong>로 발송됩니다.
              </p>
            )}

            <button onClick={handleSend} disabled={!canSend}
              style={{ width: "100%", padding: 14, background: canSend ? ROSE : "#C0B8B0", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: canSend ? "pointer" : "default", fontFamily: "inherit" }}>
              {sending ? "전송 중…" : "문의 보내기"}
            </button>
          </div>
        )}
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  );
}
