// src/app/community/page.tsx
//
// 성능 개선:
//   ★ limit(10) 초기 로딩 — PAGE_SIZE 20 → 10 으로 변경
//   ★ 더 보기 버튼 → 무한 스크롤로 전환
//     (스크롤 감지: IntersectionObserver — sentinel div가 뷰포트에 들어오면 자동 로드)
//   기존 기능 전부 유지:
//     필터(지역/음식/태그), 정렬(최신/인기), 좋아요, 위시, 신고, 수정됨 뱃지
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  collection, query, orderBy, onSnapshot, limit,
  getDocs, startAfter, type DocumentSnapshot,
  doc, updateDoc, arrayUnion, arrayRemove, increment, addDoc,
} from "firebase/firestore";
import { db }              from "@/lib/firebase/config";
import { useAuthStore }    from "@/store/authStore";
import { useWishlist }     from "@/hooks/useWishlist";
import { AppShell }        from "@/components/layout/AppShell";
import { CommunityCard }   from "@/components/community/CommunityCard";
import { ReportModal }     from "@/components/community/ReportModal";
import { Toast }           from "@/components/common/Toast";
import { KakaoAdFitInFeed } from "@/components/common/KakaoAdFitInFeed";
import { SIDO, CUISINES }  from "@/types";

const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";
const ROSE   = "#C96B52";
const HIDE_THRESHOLD = 3;
const PAGE_SIZE = 10;

function wasEdited(raw: any): boolean {
  if (typeof raw.isEdited === "boolean") return raw.isEdited;
  if (!raw.updatedAt || !raw.createdAt) return false;
  return new Date(raw.updatedAt).getTime() - new Date(raw.createdAt).getTime() > 60_000;
}

function toRecord(raw: any) {
  const showName    = raw.showAuthorName !== false;
  const authorName  = showName ? (raw.authorName ?? "") : "";
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
    edited:      wasEdited(raw),
  };
}

type RecordType = ReturnType<typeof toRecord>;

// ── 스켈레톤 카드 ──
function SkeletonCard() {
  return (
    <div style={{ background: WARM, borderRadius: 16, padding: "16px", marginBottom: 12, border: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#E2DDD8", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, width: "45%", background: "#E2DDD8", borderRadius: 6, marginBottom: 6 }} />
          <div style={{ height: 10, width: "30%", background: "#EDEBE8", borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ height: 160, background: "#E2DDD8", borderRadius: 10, marginBottom: 10 }} />
      <div style={{ height: 12, width: "80%", background: "#E2DDD8", borderRadius: 6, marginBottom: 6 }} />
      <div style={{ height: 12, width: "60%", background: "#EDEBE8", borderRadius: 6 }} />
    </div>
  );
}

export default function CommunityPage() {
  const { myUid, coupleId, myName } = useAuthStore();
  const firebaseWish                = useWishlist();

  // ★ 실시간 구독: 최신 10개만 (새 게시물 감지용)
  const [records,      setRecords]      = useState<RecordType[]>([]);
  // ★ 페이지네이션: 10개 이후 추가 로드된 게시물
  const [moreRecords,  setMoreRecords]  = useState<RecordType[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [hasMore,      setHasMore]      = useState(true);
  // ★ 마지막으로 로드된 문서 커서 (페이지네이션용)
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  // ★ 무한 스크롤 sentinel ref
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [reportTarget, setReportTarget] = useState<RecordType | null>(null);
  const [toast,        setToast]        = useState<string | null>(null);
  const [wishedIds,    setWishedIds]    = useState<Set<string>>(new Set());

  const [filterSido,    setFilterSido]    = useState("");
  const [filterCuisine, setFilterCuisine] = useState("");
  const [filterTag,     setFilterTag]     = useState("");
  const [sortBy,        setSortBy]        = useState<"recent" | "likes">("recent");

  // 전체 레코드 (실시간 10개 + 더 로드된 것들)
  const allRecords = [...records, ...moreRecords];
  const allTags = Array.from(new Set(allRecords.flatMap((r) => r.tags))).sort();

  // ★ 초기 로딩: limit(10)으로 첫 페이지만 실시간 구독
  useEffect(() => {
    const q = query(
      collection(db, "community"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs;
      setRecords(
        docs
          .map((d) => toRecord({ id: d.id, ...d.data() }))
          .filter((r) => r.reportedBy.length < HIDE_THRESHOLD)
      );
      // ★ 마지막 문서 커서 저장
      lastDocRef.current = docs[docs.length - 1] ?? null;
      // 10개 미만이면 더 이상 없음
      setHasMore(docs.length === PAGE_SIZE);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ★ 추가 로드: 커서 기반 (getDocs — 정적 로드)
  const handleLoadMore = useCallback(async () => {
    if (!lastDocRef.current || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, "community"),
        orderBy("createdAt", "desc"),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const docs = snap.docs;
      const newRecords = docs
        .map((d) => toRecord({ id: d.id, ...d.data() }))
        .filter((r) => r.reportedBy.length < HIDE_THRESHOLD);

      setMoreRecords((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        return [...prev, ...newRecords.filter((r) => !existingIds.has(r.id))];
      });

      lastDocRef.current = docs[docs.length - 1] ?? null;
      setHasMore(docs.length === PAGE_SIZE);
    } catch (e) {
      console.error("추가 로드 오류:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  // ★ IntersectionObserver — sentinel이 뷰포트에 들어오면 자동 로드
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" } // 하단 200px 전에 미리 트리거
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, handleLoadMore]);

  const displayed = allRecords
    .filter((r) => !filterSido    || r.sido    === filterSido)
    .filter((r) => !filterCuisine || r.cuisine === filterCuisine)
    .filter((r) => !filterTag     || r.tags.includes(filterTag))
    .sort((a, b) =>
      sortBy === "likes"
        ? b.likes - a.likes
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // ── 좋아요
  const handleLike = useCallback(async (record: RecordType) => {
    if (!myUid) return;
    const liked = record.likedBy.includes(myUid);
    try {
      await updateDoc(doc(db, "community", record.id), {
        likeCount: increment(liked ? -1 : 1),
        likedBy:   liked ? arrayRemove(myUid) : arrayUnion(myUid),
      });
    } catch (e) {
      console.error("좋아요 오류:", e);
    }
  }, [myUid]);

  // ── 위시 추가
  const handleWish = useCallback(async (record: RecordType) => {
    if (!myUid) return;
    if (wishedIds.has(record.id)) { setToast("이미 위시리스트에 있어요."); return; }
    try {
      await firebaseWish.add({
        name:     record.name,
        sido:     record.sido     ?? "",
        district: record.district ?? "",
        cuisine:  record.cuisine  ?? "",
        note:     `추천 탭에서 담은 맛집 (${record.authorName || "익명"})`,
        emoji:    record.emoji    ?? "🍽️",
        imgUrls:  record.imgUrls  ?? [],
        // ★ 위시 출처 기록 — admin에서 "추천에서 가져온 건지" 확인용
        fromCommunityId: record.id,
      });
      setWishedIds((prev) => new Set([...prev, record.id]));
      setToast("⭐ 위시리스트에 추가했어요!");
    } catch (e) {
      console.error("위시 오류:", e);
      setToast("❌ 추가에 실패했어요.");
    }
  }, [coupleId, myUid, myName, wishedIds, firebaseWish]);

  // ── 신고 모달 열기
  const handleReport = useCallback((record: RecordType) => {
    if (!myUid) return;
    if (record.reportedBy.includes(myUid)) { setToast("이미 신고한 게시글이에요."); return; }
    setReportTarget(record);
  }, [myUid]);

  // ── 신고 제출
  const submitReport = useCallback(async (reason: string, detail: string) => {
    if (!myUid || !reportTarget) return;
    const now = new Date().toISOString();

    await addDoc(collection(db, "community_reports"), {
      postId:      reportTarget.id,
      postName:    reportTarget.name,
      reporterUid: myUid,
      reason,
      detail:      detail || "",
      reportedAt:  now,
      status:      "pending",
    });

    await updateDoc(doc(db, "community", reportTarget.id), {
      reportedBy: arrayUnion(myUid),
    });

    setReportTarget(null);
    setToast("신고가 접수됐어요.");
  }, [myUid, reportTarget]);

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
        <div style={{ margin: "0 16px 12px", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
          💡 커플들이 공유한 맛집이에요. 글쓰기 시 <strong>커뮤니티 공유</strong>를 켜면 여기에 올라와요.
        </div>

        {/* 필터 바 */}
        <div style={{ display: "flex", gap: 6, padding: "1px 16px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
          <button onClick={() => setSortBy("recent")} className="tap" style={sortBy === "recent" ? chipActive : chipInactive}>최신순</button>
          <button onClick={() => setSortBy("likes")}  className="tap" style={sortBy === "likes"  ? chipActive : chipInactive}>❤️ 인기순</button>

          <div style={{ width: 1, background: BORDER, flexShrink: 0, margin: "4px 2px" }} />
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select value={filterSido} onChange={(e) => setFilterSido(e.target.value)} style={{ ...(filterSido ? chipActive : chipInactive), paddingRight: 22 }}>
              <option value="">지역 전체</option>
              {SIDO.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: filterSido ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
          </div>

          <div style={{ position: "relative", flexShrink: 0 }}>
            <select value={filterCuisine} onChange={(e) => setFilterCuisine(e.target.value)} style={{ ...(filterCuisine ? chipActive : chipInactive), paddingRight: 22 }}>
              <option value="">음식 전체</option>
              {CUISINES.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: filterCuisine ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
          </div>

          {allTags.length > 0 && (
            <div style={{ position: "relative", flexShrink: 0 }}>
              <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={{ ...(filterTag ? chipActive : chipInactive), paddingRight: 22 }}>
                <option value="">태그 전체</option>
                {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
              </select>
              <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: filterTag ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
            </div>
          )}

          {(filterSido || filterCuisine || filterTag) && (
            <button onClick={() => { setFilterSido(""); setFilterCuisine(""); setFilterTag(""); }} className="tap" style={{ ...chipInactive, color: ROSE, outline: `1px solid ${ROSE}` }}>
              필터 초기화
            </button>
          )}
        </div>

        {(filterSido || filterCuisine || filterTag) && !loading && (
          <p style={{ fontSize: 12, color: MUTED, margin: "0 16px 8px" }}>검색 결과 {displayed.length}개</p>
        )}

        {/* 스켈레톤 카드 */}
        {loading && (
          <div style={{ padding: "0 16px" }}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
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

        {/* 피드 목록 */}
        {!loading && displayed.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", padding: "0 16px" }}>
            {/* 최상단 광고 */}
            <KakaoAdFitInFeed />

            {displayed.map((record, i) => (
              <div key={record.id}>
                <CommunityCard
                  record={record}
                  isLiked={!!myUid && record.likedBy.includes(myUid)}
                  isWished={wishedIds.has(record.id)}
                  isOwnPost={!!myUid && record.authorUid === myUid}
                  isEdited={record.edited}
                  onLike={()   => handleLike(record)}
                  onWish={()   => handleWish(record)}
                  onReport={() => handleReport(record)}
                />
                {/* 3개마다 광고 */}
                {(i + 1) % 3 === 0 && i + 1 < displayed.length && (
                  <KakaoAdFitInFeed />
                )}
              </div>
            ))}

            {/* ★ 무한 스크롤 sentinel — 이 div가 뷰포트에 들어오면 자동 로드 */}
            <div ref={sentinelRef} style={{ height: 1 }} />

            {/* 추가 로딩 중 스피너 */}
            {loadingMore && (
              <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                <div style={{ width: 22, height: 22, border: "2.5px solid #E2DDD8", borderTopColor: ROSE, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {!hasMore && displayed.length > 0 && (
              <p style={{ textAlign: "center", fontSize: 12, color: "#C0B8B0", padding: "16px 0 24px" }}>
                모든 게시물을 불러왔어요 🎉
              </p>
            )}
          </div>
        )}
      </div>

      {reportTarget && (
        <ReportModal
          post={reportTarget}
          onReport={submitReport}
          onClose={() => setReportTarget(null)}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
