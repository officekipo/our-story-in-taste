// ============================================================
//  community/page.tsx  적용 경로: src/app/community/page.tsx
//
//  Fix:
//    1. 지역/음식/태그 필터 추가
//    2. isEdited: updatedAt > createdAt 60초 → CommunityCard에 전달
//    3. isOwnPost 전달 (이전 수정 유지)
//    4. 닉네임 비공개: showAuthorName=false → coupleLabel="익명 커플" (이전 수정 유지)
//    5. 좋아요 +2 버그 수정 (이전 수정 유지)
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, arrayUnion, arrayRemove, increment,
} from "firebase/firestore";
import { db }            from "@/lib/firebase/config";
import { useAuthStore }  from "@/store/authStore";
import { useWishlist }   from "@/hooks/useWishlist";
import { AppShell }      from "@/components/layout/AppShell";
import { CommunityCard } from "@/components/community/CommunityCard";
import { ReportModal }   from "@/components/community/ReportModal";
import { Toast }         from "@/components/common/Toast";
import { SIDO, CUISINES } from "@/types";

const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";
const ROSE   = "#C96B52";
const HIDE_THRESHOLD = 3;

// 수정됨 판별
function wasEdited(raw: any): boolean {
  if (!raw.updatedAt || !raw.createdAt) return false;
  return new Date(raw.updatedAt).getTime() - new Date(raw.createdAt).getTime() > 60_000;
}

function toRecord(raw: any) {
  // ★ showAuthorName=false 이면 authorName 숨김 (닉네임 비공개 버그 수정)
  const showName   = raw.showAuthorName !== false;
  const authorName = showName ? (raw.authorName ?? "") : "";
  const coupleLabel = showName
    ? (raw.authorName ? `${raw.authorName}의 추천` : "커플 추천")
    : "익명 커플";

  return {
    id:          raw.id          ?? "",
    coupleId:    raw.coupleId    ?? "",
    visitedId:   raw.visitedId   ?? "",
    name:        raw.name        ?? raw.restaurantName ?? "",
    cuisine:     raw.cuisine     ?? "",
    sido:        raw.sido        ?? "",
    district:    raw.district    ?? "",
    rating:      raw.rating      ?? 0,
    memo:        raw.memo        ?? "",
    tags:        Array.isArray(raw.tags)    ? raw.tags    : [],
    imgUrls:     Array.isArray(raw.imgUrls) ? raw.imgUrls : [],
    emoji:       raw.emoji       ?? "🍽️",
    authorUid:   raw.authorUid   ?? "",
    authorName,
    coupleLabel,
    likes:       typeof raw.likeCount === "number" ? raw.likeCount : 0,
    likedBy:     Array.isArray(raw.likedBy)    ? raw.likedBy    : [],
    reportedBy:  Array.isArray(raw.reportedBy) ? raw.reportedBy : [],
    createdAt:   raw.createdAt   ?? "",
    updatedAt:   raw.updatedAt   ?? "",
    edited:      wasEdited(raw),  // ★ 수정됨 여부
  };
}

type RecordType = ReturnType<typeof toRecord>;

export default function CommunityPage() {
  const { myUid, coupleId, myName } = useAuthStore();
  const firebaseWish                = useWishlist();

  const [records,      setRecords]      = useState<RecordType[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [reportTarget, setReportTarget] = useState<any | null>(null);
  const [toast,        setToast]        = useState<string | null>(null);
  const [wishedIds,    setWishedIds]    = useState<Set<string>>(new Set());

  // ★ 필터 상태
  const [filterSido,    setFilterSido]    = useState("");
  const [filterCuisine, setFilterCuisine] = useState("");
  const [filterTag,     setFilterTag]     = useState("");

  // 전체 태그 목록 (records에서 추출)
  const allTags = Array.from(new Set(records.flatMap((r) => r.tags))).sort();

  useEffect(() => {
    const q = query(collection(db, "community"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRecords(
        snap.docs
          .map((d) => toRecord({ id: d.id, ...d.data() }))
          .filter((r) => r.reportedBy.length < HIDE_THRESHOLD)
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ★ 필터 적용
  const displayed = records
    .filter((r) => !filterSido    || r.sido    === filterSido)
    .filter((r) => !filterCuisine || r.cuisine === filterCuisine)
    .filter((r) => !filterTag     || r.tags.includes(filterTag));

  // ── 좋아요 ─────────────────────────────────────────────────
  const handleLike = useCallback(async (record: RecordType) => {
    if (!myUid) return;
    const liked = record.likedBy.includes(myUid);
    try {
      await updateDoc(doc(db, "community", record.id), {
        likedBy:   liked ? arrayRemove(myUid) : arrayUnion(myUid),
        likeCount: increment(liked ? -1 : 1),
      });
    } catch (e) { console.error("좋아요 오류:", e); }
  }, [myUid]);

  // ── 위시 추가 ─────────────────────────────────────────────
  const handleWish = useCallback(async (record: RecordType) => {
    if (!coupleId || !myUid || !myName) return;
    if (wishedIds.has(record.id)) { setToast("이미 위시리스트에 추가했어요 ⭐"); return; }
    try {
      await firebaseWish.add({
        name:     record.name,
        sido:     record.sido     ?? "",
        district: record.district ?? "",
        cuisine:  record.cuisine  ?? "",
        note:     `추천 탭에서 담은 맛집 (${record.authorName || "익명"})`,
        emoji:    record.emoji    ?? "🍽️",
        imgUrls:  record.imgUrls  ?? [],
      });
      setWishedIds((prev) => new Set([...prev, record.id]));
      setToast("⭐ 위시리스트에 추가했어요!");
    } catch (e) {
      console.error("위시 오류:", e);
      setToast("❌ 추가에 실패했어요.");
    }
  }, [coupleId, myUid, myName, wishedIds, firebaseWish]);

  // ── 신고 ─────────────────────────────────────────────────
  const handleReport = useCallback(async (record: RecordType) => {
    if (!myUid) return;
    if (record.reportedBy.includes(myUid)) { setToast("이미 신고한 게시글이에요."); return; }
    setReportTarget(record);
  }, [myUid]);

  const submitReport = useCallback(async (record: any) => {
    if (!myUid) return;
    await updateDoc(doc(db, "community", record.id), { reportedBy: arrayUnion(myUid) });
    setReportTarget(null);
    setToast("신고가 접수됐어요.");
  }, [myUid]);

  // ── 필터 칩 스타일 ────────────────────────────────────────
  const chipBase: React.CSSProperties = {
    padding: "6px 12px", borderRadius: 20, fontSize: 12,
    cursor: "pointer", border: "none", fontFamily: "inherit",
    whiteSpace: "nowrap", flexShrink: 0,
  };
  const chipActive:   React.CSSProperties = { ...chipBase, background: ROSE,  color: "#fff",  outline: `1.5px solid ${ROSE}` };
  const chipInactive: React.CSSProperties = { ...chipBase, background: "#fff", color: MUTED,  outline: `1px solid ${BORDER}` };

  return (
    <AppShell activeTab="community">
      <div style={{ padding: "16px 0" }}>
        {/* 안내 */}
        <div style={{ margin: "0 16px 12px", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
          💡 커플들이 공유한 맛집이에요. 글쓰기 시 <strong>커뮤니티 공유</strong>를 켜면 여기에 올라와요.
        </div>

        {/* ★ 필터 바 */}
        <div style={{ display: "flex", gap: 6, padding: "0 16px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
          {/* 지역 필터 */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select
              value={filterSido}
              onChange={(e) => setFilterSido(e.target.value)}
              style={{ ...(filterSido ? chipActive : chipInactive), paddingRight: 22 }}
            >
              <option value="">지역 전체</option>
              {SIDO.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: filterSido ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
          </div>

          {/* 음식 필터 */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select
              value={filterCuisine}
              onChange={(e) => setFilterCuisine(e.target.value)}
              style={{ ...(filterCuisine ? chipActive : chipInactive), paddingRight: 22 }}
            >
              <option value="">음식 전체</option>
              {CUISINES.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: filterCuisine ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
          </div>

          {/* 태그 필터 */}
          {allTags.length > 0 && (
            <div style={{ position: "relative", flexShrink: 0 }}>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                style={{ ...(filterTag ? chipActive : chipInactive), paddingRight: 22 }}
              >
                <option value="">태그 전체</option>
                {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
              </select>
              <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: filterTag ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
            </div>
          )}

          {/* 초기화 버튼 */}
          {(filterSido || filterCuisine || filterTag) && (
            <button
              onClick={() => { setFilterSido(""); setFilterCuisine(""); setFilterTag(""); }}
              style={{ ...chipInactive, color: ROSE, outline: `1px solid ${ROSE}` }}
            >
              초기화
            </button>
          )}
        </div>

        {/* 결과 수 */}
        {(filterSido || filterCuisine || filterTag) && !loading && (
          <p style={{ fontSize: 12, color: MUTED, margin: "0 16px 8px" }}>
            검색 결과 {displayed.length}개
          </p>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" }}>
            {[1,2,3].map((i) => (
              <div key={i} style={{ height: 260, background: WARM, borderRadius: 16, opacity: 0.6 }} />
            ))}
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px", gap: 12 }}>
            <div style={{ fontSize: 56 }}>🌐</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: INK }}>
              {filterSido || filterCuisine || filterTag ? "조건에 맞는 맛집이 없어요" : "아직 공유된 맛집이 없어요"}
            </div>
            <div style={{ fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 1.6 }}>
              {filterSido || filterCuisine || filterTag
                ? "다른 조건으로 검색해보세요"
                : "다녀온 곳을 기록할 때\n커뮤니티 공유를 켜면 여기에 올라와요!"}
            </div>
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", padding: "0 16px" }}>
            {displayed.map((record) => (
              <CommunityCard
                key={record.id}
                record={record}
                isLiked={!!myUid && record.likedBy.includes(myUid)}
                isWished={wishedIds.has(record.id)}
                isOwnPost={!!myUid && record.authorUid === myUid}
                isEdited={record.edited}   // ★ 수정됨 전달
                onLike={()   => handleLike(record)}
                onWish={()   => handleWish(record)}
                onReport={()  => handleReport(record)}
              />
            ))}
          </div>
        )}
      </div>

      {reportTarget && (
        <ReportModal
          post={reportTarget}
          onReport={() => submitReport(reportTarget)}
          onClose={() => setReportTarget(null)}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
