// src/app/settings/support/page.tsx
"use client";

import { useState, useEffect }         from "react";
import { useRouter }                   from "next/navigation";
import { useAuthStore }                from "@/store/authStore";
import { auth }                        from "@/lib/firebase/config";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, doc, onSnapshot as docSnap,
  getDocs, where,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { db } from "@/lib/firebase/config";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const SAGE    = "#6B9E7E";
const SAGE_LT = "#C8DED1";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const CREAM   = "#F0EBE3";
const BG      = "#F5F0EB";

interface FAQItem { id: string; question: string; answer: string; order: number; category: string; }

/* ── 데이터 내보내기 타입 ── */
type ExportFormat  = "csv" | "json" | "xlsx";
type ExportScope   = "both" | "visited" | "wishlist";
type ExportAuthor  = "all" | "mine" | "partner";
type ExportState   = "idle" | "loading" | "done" | "error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toStr(val: any): string {
  if (val == null) return "";
  if (typeof val === "string")  return val;
  if (typeof val === "number")  return String(val);
  if (Array.isArray(val))       return val.join(", ");
  if (val?.toDate)              return val.toDate().toISOString().slice(0, 10);
  return JSON.stringify(val);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenVisited(item: any, myUid: string, myName: string, partnerName: string) {
  const isMe = item.authorUid === myUid;
  return {
    식당명:       toStr(item.name),
    시도:         toStr(item.sido),
    구:           toStr(item.district),
    음식종류:     toStr(item.cuisine),
    별점:         toStr(item.rating),
    방문일:       toStr(item.date),
    메모:         toStr(item.memo),
    태그:         toStr(item.tags),
    이모지:       toStr(item.emoji),
    이미지수:     Array.isArray(item.imgUrls) ? item.imgUrls.length : 0,
    위도:         toStr(item.lat),
    경도:         toStr(item.lng),
    커뮤니티공유: item.shareToComm ? "Y" : "N",
    작성자:       isMe ? (myName || "나") : (partnerName || "파트너"),
    등록일:       toStr(item.createdAt),
    수정일:       toStr(item.updatedAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenWishlist(item: any, myUid: string, myName: string, partnerName: string) {
  const isMe = item.addedByUid === myUid;
  return {
    식당명:   toStr(item.name),
    시도:     toStr(item.sido),
    구:       toStr(item.district),
    음식종류: toStr(item.cuisine),
    메모:     toStr(item.note),
    이모지:   toStr(item.emoji),
    이미지수: Array.isArray(item.imgUrls) ? item.imgUrls.length : 0,
    위도:     toStr(item.lat),
    경도:     toStr(item.lng),
    추가일:   toStr(item.addedDate),
    추가한사람: isMe ? (myName || "나") : (partnerName || "파트너"),
    등록일:   toStr(item.createdAt),
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportCsv(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ];
  downloadBlob(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" }), filename);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportJson(data: any, filename: string) {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), filename);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportXlsx(sheets: { name: string; rows: any[] }[], filename: string) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
    // 열 너비 자동조정
    const cols = rows.length
      ? Object.keys(rows[0]).map((key) => ({
          wch: Math.min(
            40,
            Math.max(key.length + 2, ...rows.map((r) => String(r[key] ?? "").length + 1))
          ),
        }))
      : [];
    ws["!cols"] = cols;
    // 헤더 볼드 (A1~Z1 범위)
    if (rows.length) {
      const headers = Object.keys(rows[0]);
      headers.forEach((_, i) => {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
        if (ws[cellRef]) {
          ws[cellRef].s = { font: { bold: true }, fill: { fgColor: { rgb: "F2D5CC" } } };
        }
      });
    }
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, filename);
}

/* ── FAQ 카테고리 ── */
const FAQ_CATEGORIES = ["커플 연동", "맛집 기록", "위시리스트", "지도·통계", "커뮤니티", "알림", "앱·계정"];

/* ── 1:1 문의 유형 ── */
const CONTACT_CATEGORIES = ["앱 오류/버그", "기능 문의", "계정 문제", "데이터 내보내기 요청", "기타"];

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "rgba(26,20,18,0.9)", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: "nowrap", pointerEvents: "none" }}>
      {msg}
    </div>
  );
}

/* ── 아코디언 섹션 공통 컴포넌트 ── */
function AccordionSection({ title, icon, open, onToggle, children }: { title: string; icon: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>{title}</span>
        </div>
        <span style={{ fontSize: 16, color: open ? ROSE : "#C0B8B0", display: "block", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const router = useRouter();
  const { myName, myUid, coupleId, partnerName } = useAuthStore();

  const [faqs,         setFaqs]         = useState<FAQItem[]>([]);
  const [supportEmail, setSupportEmail] = useState("");
  const [appVersion,   setAppVersion]   = useState("1.0.0");
  const [notice,       setNotice]       = useState("");

  const [openFaq,    setOpenFaq]    = useState<string | null>(null);
  const [activeCat,  setActiveCat]  = useState(FAQ_CATEGORIES[0]);
  const [category,   setCategory]   = useState("");
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [content,    setContent]    = useState("");
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [toast,      setToast]      = useState<string | null>(null);

  /* 아코디언 열림 상태 */
  const [openExport,  setOpenExport]  = useState(false);
  const [openFaqSec,  setOpenFaqSec]  = useState(true);
  const [openContact, setOpenContact] = useState(false);

  /* 데이터 내보내기 상태 */
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportScope,  setExportScope]  = useState<ExportScope>("both");
  const [exportAuthor, setExportAuthor] = useState<ExportAuthor>("all");
  const [exportState,  setExportState]  = useState<ExportState>("idle");
  const [exportCounts, setExportCounts] = useState<{ visited: number; wishlist: number } | null>(null);
  const [exportError,  setExportError]  = useState("");

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

  const handleExport = async () => {
    if (!myUid) return;
    setExportState("loading"); setExportError(""); setExportCounts(null);
    try {
      const cid: string = coupleId ?? "";
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const prefix = `맛지도_${today}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let visitedRows: any[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let wishlistRows: any[] = [];

      if (exportScope === "visited" || exportScope === "both") {
        const q = cid
          ? query(collection(db, "visited"), where("coupleId", "==", cid), orderBy("createdAt", "desc"))
          : query(collection(db, "visited"), where("authorUid", "==", myUid), orderBy("createdAt", "desc"));
        const docs = (await getDocs(q)).docs;
        const all = docs.map((d) => ({ ...d.data(), _uid: d.data().authorUid }));
        const filtered = exportAuthor === "mine"    ? all.filter((r) => r._uid === myUid)
                       : exportAuthor === "partner" ? all.filter((r) => r._uid !== myUid)
                       : all;
        visitedRows = filtered.map((item) => flattenVisited(item, myUid, myName, partnerName));
      }
      if (exportScope === "wishlist" || exportScope === "both") {
        const q = cid
          ? query(collection(db, "wishlist"), where("coupleId", "==", cid), orderBy("createdAt", "desc"))
          : query(collection(db, "wishlist"), where("addedByUid", "==", myUid), orderBy("createdAt", "desc"));
        const docs = (await getDocs(q)).docs;
        const all = docs.map((d) => ({ ...d.data() }));
        const filtered = exportAuthor === "mine"    ? all.filter((r) => r.addedByUid === myUid)
                       : exportAuthor === "partner" ? all.filter((r) => r.addedByUid !== myUid)
                       : all;
        wishlistRows = filtered.map((item) => flattenWishlist(item, myUid, myName, partnerName));
      }

      if (!visitedRows.length && !wishlistRows.length) {
        setExportError("내보낼 데이터가 없어요."); setExportState("error"); return;
      }
      setExportCounts({ visited: visitedRows.length, wishlist: wishlistRows.length });

      if (exportFormat === "csv") {
        if (visitedRows.length)  exportCsv(visitedRows,  `${prefix}_다녀온곳.csv`);
        if (wishlistRows.length) exportCsv(wishlistRows, `${prefix}_위시리스트.csv`);
      } else if (exportFormat === "json") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: Record<string, any> = {};
        if (exportScope === "visited"  || exportScope === "both") data.visited  = visitedRows;
        if (exportScope === "wishlist" || exportScope === "both") data.wishlist = wishlistRows;
        exportJson(data, `${prefix}.json`);
      } else {
        const sheets = [];
        if (visitedRows.length)  sheets.push({ name: "다녀온 곳",  rows: visitedRows });
        if (wishlistRows.length) sheets.push({ name: "위시리스트", rows: wishlistRows });
        exportXlsx(sheets, `${prefix}.xlsx`);
      }
      setExportState("done");
    } catch (e) {
      console.error(e);
      setExportError("데이터를 불러오는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
      setExportState("error");
    }
  };

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
  const filteredFaqs = faqs.filter((f) => f.category === activeCat);

  return (
    <div style={{ minHeight: "100vh", background: BG, maxWidth: 480, margin: "0 auto", fontFamily: "inherit", paddingBottom: 48 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: MUTED, lineHeight: 1, padding: "0 4px 0 0" }}>‹</button>
        <p style={{ fontSize: 17, fontWeight: 700, color: INK }}>고객센터</p>
      </div>

      {/* 공지사항 */}
      {notice ? (
        <div style={{ margin: "12px 16px 0", padding: "12px 16px", background: "#FFF8E7", borderRadius: 12, border: "1px solid #F5E0A0", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📢</span>
          <p style={{ fontSize: 13, color: "#7A5C00", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{notice}</p>
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

      {/* ── 데이터 내보내기 아코디언 ── */}
      <div style={{ margin: "20px 16px 0" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>데이터 내보내기</p>
        <AccordionSection title="내 기록 다운로드" icon="📤" open={openExport} onToggle={() => setOpenExport((v) => !v)}>
          <div style={{ padding: "16px" }}>

            {/* 데이터 범위 */}
            <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>데이터 범위</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {(["both", "visited", "wishlist"] as ExportScope[]).map((s) => {
                const active = exportScope === s;
                const label  = s === "both" ? "전체" : s === "visited" ? "다녀온 곳" : "위시리스트";
                return (
                  <button key={s} onClick={() => setExportScope(s)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1.5px solid ${active ? ROSE : BORDER}`, background: active ? ROSE_LT : BG, color: active ? ROSE : MUTED, fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
                    {label}
                  </button>
                );
              })}
            </div>

            {/* 작성자 필터 — 커플 연동 시만 표시 */}
            {coupleId && (
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>작성자</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {([
                    { v: "all"     as ExportAuthor, label: "전체" },
                    { v: "mine"    as ExportAuthor, label: myName    || "나" },
                    { v: "partner" as ExportAuthor, label: partnerName || "파트너" },
                  ]).map(({ v, label }) => {
                    const active = exportAuthor === v;
                    return (
                      <button key={v} onClick={() => setExportAuthor(v)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1.5px solid ${active ? SAGE : BORDER}`, background: active ? SAGE_LT : BG, color: active ? SAGE : MUTED, fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 파일 형식 */}
            <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>파일 형식</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {([
                { f: "csv"  as ExportFormat, label: "CSV",  desc: "엑셀·구글시트에서 바로 열기", icon: "📄" },
                { f: "xlsx" as ExportFormat, label: "엑셀", desc: "서식이 포함된 스프레드시트",   icon: "📊" },
                { f: "json" as ExportFormat, label: "JSON", desc: "개발자용 원시 데이터",         icon: "🗂" },
              ]).map(({ f, label, desc, icon }) => {
                const active = exportFormat === f;
                return (
                  <button key={f} onClick={() => setExportFormat(f)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${active ? ROSE : BORDER}`, background: active ? ROSE_LT : BG, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: active ? 700 : 600, color: active ? ROSE : INK }}>{label}</div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{desc}</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? ROSE : BORDER}`, background: active ? ROSE : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 다운로드 버튼 */}
            <button onClick={handleExport} disabled={exportState === "loading"} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: exportState === "loading" ? BORDER : ROSE, color: exportState === "loading" ? MUTED : "#fff", fontSize: 15, fontWeight: 700, cursor: exportState === "loading" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
              {exportState === "loading" ? (
                <>
                  <span style={{ display: "inline-block", width: 16, height: 16, border: `2px solid ${MUTED}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  불러오는 중…
                </>
              ) : "📥 지금 다운로드"}
            </button>

            {exportState === "done" && exportCounts && (
              <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: SAGE_LT, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 16, marginTop: 1 }}>✅</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: SAGE, marginBottom: 2 }}>다운로드 완료!</p>
                  <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>다녀온 곳 {exportCounts.visited}개 · 위시리스트 {exportCounts.wishlist}개가 저장됐어요. 파일을 찾을 수 없다면 브라우저 다운로드 폴더를 확인해 주세요.</p>
                </div>
              </div>
            )}
            {exportState === "error" && (
              <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "#FFF0EE", display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 16, marginTop: 1 }}>⚠️</span>
                <p style={{ fontSize: 13, color: ROSE, lineHeight: 1.5 }}>{exportError}</p>
              </div>
            )}

            {/* 안내 */}
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: CREAM }}>
              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.7 }}>💡 <strong style={{ color: INK }}>CSV / 엑셀</strong>은 구글 시트·Excel에서 바로 열 수 있어요. 이미지는 포함되지 않으며 이미지 <strong style={{ color: INK }}>개수</strong>만 표시돼요.</p>
            </div>
          </div>
        </AccordionSection>
      </div>

      {/* ── 자주 묻는 질문 아코디언 ── */}
      <div style={{ margin: "12px 16px 0" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>자주 묻는 질문</p>
        <AccordionSection title="FAQ" icon="❓" open={openFaqSec} onToggle={() => setOpenFaqSec((v) => !v)}>
          <div style={{ padding: "14px 16px" }}>
            {/* 카테고리 탭 */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
              {FAQ_CATEGORIES.map((cat) => {
                const active = activeCat === cat;
                const count  = faqs.filter((f) => f.category === cat).length;
                if (count === 0) return null;
                return (
                  <button key={cat} onClick={() => { setActiveCat(cat); setOpenFaq(null); }} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${active ? ROSE : BORDER}`, background: active ? ROSE_LT : BG, color: active ? ROSE : MUTED, fontSize: 12, fontWeight: active ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                    {cat}
                  </button>
                );
              })}
            </div>

            {filteredFaqs.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <p style={{ fontSize: 14, color: MUTED }}>등록된 FAQ가 없어요</p>
              </div>
            ) : (
              <div style={{ borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                {filteredFaqs.map((item, i) => (
                  <div key={item.id} style={{ borderBottom: i < filteredFaqs.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <button onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
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
        </AccordionSection>
      </div>

      {/* ── 1:1 문의 아코디언 ── */}
      <div style={{ margin: "12px 16px 0" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>1:1 문의하기</p>
        <AccordionSection title="문의 보내기" icon="✉️" open={openContact} onToggle={() => setOpenContact((v) => !v)}>
          {sent ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 8 }}>문의가 접수됐어요</p>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
                {supportEmail ? `${supportEmail}로 빠르게 답변 드릴게요.` : "빠르게 답변 드릴게요."}
              </p>
              <button onClick={() => { setSent(false); setCategory(""); setContent(""); }} style={{ marginTop: 20, padding: "10px 24px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                새 문의하기
              </button>
            </div>
          ) : (
            <div style={{ padding: "16px 18px 20px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>이름 *</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 14 }} />

              <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>답변받을 이메일 *</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 4 }} />
              {!auth.currentUser?.email && <p style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>답변받으실 이메일을 직접 입력해주세요.</p>}
              {auth.currentUser?.email  && <p style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>가입한 이메일로 자동 입력됐어요. 다른 주소로 받으시려면 수정하세요.</p>}

              <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 10 }}>문의 유형 *</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {CONTACT_CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCategory(c)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${category === c ? ROSE : BORDER}`, background: category === c ? ROSE_LT : WARM, color: category === c ? ROSE : MUTED, fontSize: 13, fontWeight: category === c ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                    {c}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>문의 내용 *</p>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={`불편하신 점이나 문의 사항을 자세히 작성해주세요.\n\n앱 버전: v${appVersion}\n닉네임: ${myName}`} rows={6} style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6, marginBottom: 16 }} />

              {supportEmail && <p style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>답변은 <strong>{supportEmail}</strong>로 발송됩니다.</p>}

              <button onClick={handleSend} disabled={!canSend} style={{ width: "100%", padding: 14, background: canSend ? ROSE : "#C0B8B0", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: canSend ? "pointer" : "default", fontFamily: "inherit" }}>
                {sending ? "전송 중…" : "문의 보내기"}
              </button>
            </div>
          )}
        </AccordionSection>
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  );
}
