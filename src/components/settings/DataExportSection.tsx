"use client";

/**
 * DataExportSection.tsx
 * 설정 > 고객센터 페이지의 "데이터 내보내기" 섹션 컴포넌트
 *
 * 사용법:
 *   import DataExportSection from "@/components/settings/DataExportSection";
 *   // support/page.tsx의 기존 "데이터 내보내기 안내" 섹션을 아래로 교체:
 *   <DataExportSection />
 *
 * 의존성 (없으면 설치):
 *   npm install xlsx
 */

import { useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuthStore } from "@/store/authStore";
import * as XLSX from "xlsx";

// ─── 색상 토큰 ────────────────────────────────────────────────
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

// ─── 타입 ──────────────────────────────────────────────────────
type ExportFormat = "csv" | "json" | "xlsx";
type ExportScope  = "visited" | "wishlist" | "both";
type ExportState  = "idle" | "loading" | "done" | "error";

interface ExportOption {
  format: ExportFormat;
  label: string;
  desc: string;
  icon: string;
}

const FORMAT_OPTIONS: ExportOption[] = [
  { format: "csv",  label: "CSV",   desc: "엑셀·구글시트에서 바로 열기", icon: "📄" },
  { format: "xlsx", label: "엑셀",  desc: "서식이 포함된 스프레드시트",   icon: "📊" },
  { format: "json", label: "JSON",  desc: "개발자용 원시 데이터",         icon: "🗂" },
];

// ─── Firestore 조회 헬퍼 ──────────────────────────────────────
async function fetchVisited(coupleId: string, authorUid: string) {
  const col = collection(db, "visited");
  const q = coupleId
    ? query(col, where("coupleId", "==", coupleId), orderBy("createdAt", "desc"))
    : query(col, where("authorUid", "==", authorUid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function fetchWishlist(coupleId: string, authorUid: string) {
  const col = collection(db, "wishlist");
  const q = coupleId
    ? query(col, where("coupleId", "==", coupleId), orderBy("createdAt", "desc"))
    : query(col, where("addedByUid", "==", authorUid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Firestore Timestamp → 문자열 변환 ────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toStr(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) return val.join(", ");
  // Firestore Timestamp
  if (val?.toDate) return val.toDate().toISOString().slice(0, 10);
  return JSON.stringify(val);
}

// ─── visited 행 평탄화 ────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenVisited(item: any) {
  return {
    id:           toStr(item.id),
    식당명:        toStr(item.name),
    시도:          toStr(item.sido),
    구:            toStr(item.district),
    음식종류:      toStr(item.cuisine),
    별점:          toStr(item.rating),
    방문일:        toStr(item.date),
    메모:          toStr(item.memo),
    태그:          toStr(item.tags),
    이모지:        toStr(item.emoji),
    이미지수:      Array.isArray(item.imgUrls) ? item.imgUrls.length : 0,
    위도:          toStr(item.lat),
    경도:          toStr(item.lng),
    커뮤니티공유:  item.shareToComm ? "Y" : "N",
    작성자공개:    item.hideAuthor  ? "N" : "Y",
    작성자UID:     toStr(item.authorUid),
    등록일:        toStr(item.createdAt),
    수정일:        toStr(item.updatedAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenWishlist(item: any) {
  return {
    id:       toStr(item.id),
    식당명:    toStr(item.name),
    시도:      toStr(item.sido),
    구:        toStr(item.district),
    음식종류:  toStr(item.cuisine),
    메모:      toStr(item.note),
    이모지:    toStr(item.emoji),
    이미지수:  Array.isArray(item.imgUrls) ? item.imgUrls.length : 0,
    위도:      toStr(item.lat),
    경도:      toStr(item.lng),
    추가일:    toStr(item.addedDate),
    추가한UID: toStr(item.addedByUid),
    등록일:    toStr(item.createdAt),
  };
}

// ─── 다운로드 유틸 ────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportCsv(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines   = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, filename);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportXlsx(sheets: { name: string; rows: any[] }[], filename: string) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
    // 헤더 스타일 (배경색) — xlsx 커뮤니티 에디션은 제한적, 기본 bold
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, filename);
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function DataExportSection() {
  const { userDoc, coupleId } = useAuthStore();
  const uid = userDoc?.uid ?? "";

  const [format, setFormat]   = useState<ExportFormat>("csv");
  const [scope,  setScope]    = useState<ExportScope>("both");
  const [state,  setState]    = useState<ExportState>("idle");
  const [counts, setCounts]   = useState<{ visited: number; wishlist: number } | null>(null);
  const [error,  setError]    = useState("");

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  async function handleExport() {
    if (!uid) return;
    setState("loading");
    setError("");
    setCounts(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let visitedRows: any[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let wishlistRows: any[] = [];

      if (scope === "visited" || scope === "both") {
        const raw = await fetchVisited(coupleId ?? "", uid);
        visitedRows = raw.map(flattenVisited);
      }
      if (scope === "wishlist" || scope === "both") {
        const raw = await fetchWishlist(coupleId ?? "", uid);
        wishlistRows = raw.map(flattenWishlist);
      }

      setCounts({ visited: visitedRows.length, wishlist: wishlistRows.length });

      const prefix = `맛지도_${today}`;

      if (format === "csv") {
        if (visitedRows.length)  exportCsv(visitedRows,  `${prefix}_다녀온곳.csv`);
        if (wishlistRows.length) exportCsv(wishlistRows, `${prefix}_위시리스트.csv`);
        if (!visitedRows.length && !wishlistRows.length) {
          setError("내보낼 데이터가 없어요."); setState("error"); return;
        }
      } else if (format === "json") {
        const data: Record<string, unknown> = {};
        if (scope === "visited"  || scope === "both") data.visited   = visitedRows;
        if (scope === "wishlist" || scope === "both") data.wishlist  = wishlistRows;
        exportJson(data, `${prefix}.json`);
      } else {
        const sheets = [];
        if (visitedRows.length  || scope === "visited"  || scope === "both")
          sheets.push({ name: "다녀온 곳",   rows: visitedRows });
        if (wishlistRows.length || scope === "wishlist" || scope === "both")
          sheets.push({ name: "위시리스트", rows: wishlistRows });
        if (!sheets.length) { setError("내보낼 데이터가 없어요."); setState("error"); return; }
        exportXlsx(sheets, `${prefix}.xlsx`);
      }

      setState("done");
    } catch (e) {
      console.error(e);
      setError("데이터를 불러오는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
      setState("error");
    }
  }

  // ── UI ──────────────────────────────────────────────────────
  return (
    <section style={{ background: WARM, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: "hidden", marginBottom: 12 }}>

      {/* 헤더 */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>📤</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>데이터 내보내기</span>
        </div>
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, paddingLeft: 26 }}>
          내 기록을 CSV·엑셀·JSON 파일로 직접 다운로드할 수 있어요.
          {coupleId ? " 커플 전체 데이터가 포함돼요." : " 본인이 작성한 기록만 포함돼요."}
        </p>
      </div>

      <div style={{ height: 1, background: BORDER, margin: "14px 0 0" }} />

      {/* 범위 선택 */}
      <div style={{ padding: "14px 16px 0" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8, letterSpacing: "0.04em" }}>내보낼 범위</p>
        <div style={{ display: "flex", gap: 8 }}>
          {(["both", "visited", "wishlist"] as ExportScope[]).map((s) => {
            const active = scope === s;
            const label  = s === "both" ? "전체" : s === "visited" ? "다녀온 곳" : "위시리스트";
            return (
              <button
                key={s}
                onClick={() => setScope(s)}
                style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1.5px solid ${active ? ROSE : BORDER}`, background: active ? ROSE_LT : BG, color: active ? ROSE : MUTED, fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 형식 선택 */}
      <div style={{ padding: "14px 16px 0" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8, letterSpacing: "0.04em" }}>파일 형식</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FORMAT_OPTIONS.map(({ format: f, label, desc, icon }) => {
            const active = format === f;
            return (
              <button
                key={f}
                onClick={() => setFormat(f)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${active ? ROSE : BORDER}`, background: active ? ROSE_LT : BG, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
              >
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
      </div>

      {/* 다운로드 버튼 */}
      <div style={{ padding: "16px" }}>
        <button
          onClick={handleExport}
          disabled={state === "loading"}
          style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: state === "loading" ? BORDER : ROSE, color: state === "loading" ? MUTED : "#fff", fontSize: 15, fontWeight: 700, cursor: state === "loading" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}
        >
          {state === "loading" ? (
            <>
              <span style={{ display: "inline-block", width: 16, height: 16, border: `2px solid ${MUTED}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              불러오는 중…
            </>
          ) : "📥 지금 다운로드"}
        </button>

        {/* 결과 피드백 */}
        {state === "done" && counts && (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: SAGE_LT, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 16, marginTop: 1 }}>✅</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: SAGE, marginBottom: 2 }}>다운로드 완료!</p>
              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                다녀온 곳 {counts.visited}개 · 위시리스트 {counts.wishlist}개가 저장됐어요.{"\n"}
                파일을 찾을 수 없다면 브라우저의 다운로드 폴더를 확인해 주세요.
              </p>
            </div>
          </div>
        )}

        {state === "error" && (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "#FFF0EE", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 16, marginTop: 1 }}>⚠️</span>
            <p style={{ fontSize: 13, color: ROSE, lineHeight: 1.5 }}>{error}</p>
          </div>
        )}
      </div>

      {/* 안내 문구 */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ padding: "10px 12px", borderRadius: 10, background: CREAM }}>
          <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
            💡 <strong style={{ color: INK }}>CSV / 엑셀</strong>은 구글 시트·Microsoft Excel에서 바로 열 수 있어요.{"\n"}
            이미지 파일은 포함되지 않으며, 기록에 등록된 이미지 <strong style={{ color: INK }}>개수</strong>만 표시돼요.
          </p>
        </div>
      </div>

      {/* 스피너 keyframes (전역 CSS에 이미 없을 경우 대비) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
