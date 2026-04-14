// ============================================================
//  community/page.tsx  적용 경로: src/app/community/page.tsx
//
//  Fix 4, 5:
//    - CommunityCard props 에 맞게 isLiked/isWished 전달
//    - Firestore 데이터 → CommunityRecord 형태로 정규화
//    - likeCount(숫자) → likes 로 매핑, NaN 방지
//    - isLiked: likedBy 배열에 myUid 포함 여부
//    - isWished: 로컬 state 로 관리
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

const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";
const HIDE_THRESHOLD = 3;

// Firestore raw → CommunityCard 가 기대하는 CommunityRecord 형태로 변환
function toRecord(raw: any) {
  return {
    id:          raw.id          ?? "",
    coupleId:    raw.coupleId    ?? "",
    visitedId:   raw.visitedId   ?? "",
    name:        raw.name        ?? raw.restaurantName ?? "",   // ★ 이름 통일
    cuisine:     raw.cuisine     ?? "",
    sido:        raw.sido        ?? "",
    district:    raw.district    ?? "",
    rating:      raw.rating      ?? 0,
    memo:        raw.memo        ?? "",
    tags:        Array.isArray(raw.tags)       ? raw.tags       : [],
    imgUrls:     Array.isArray(raw.imgUrls)    ? raw.imgUrls    : [],
    emoji:       raw.emoji       ?? "🍽️",
    authorUid:   raw.authorUid   ?? "",
    authorName:  raw.authorName  ?? "",
    // CommunityCard 에서 표시할 커플 라벨
    coupleLabel: raw.showAuthorName === false
      ? "익명 커플"
      : (raw.authorName ? `${raw.authorName}의 추천` : "커플 추천"),
    likes:       typeof raw.likeCount === "number" ? raw.likeCount : 0, // ★ NaN 방지
    likedBy:     Array.isArray(raw.likedBy)    ? raw.likedBy    : [],
    reportedBy:  Array.isArray(raw.reportedBy) ? raw.reportedBy : [],
    createdAt:   raw.createdAt   ?? "",
  };
}

export default function CommunityPage() {
  const { myUid, coupleId, myName } = useAuthStore();
  const firebaseWish                = useWishlist();

  const [records,      setRecords]      = useState<ReturnType<typeof toRecord>[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [reportTarget, setReportTarget] = useState<any | null>(null);
  const [toast,        setToast]        = useState<string | null>(null);
  // 위시 추가된 visitedId 목록 (로컬 관리)
  const [wishedIds, setWishedIds] = useState<Set<string>>(new Set());

  // ── 실시간 구독 ─────────────────────────────────────────
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

  // ── 좋아요 토글 ─────────────────────────────────────────
  const handleLike = useCallback(async (record: ReturnType<typeof toRecord>) => {
    if (!myUid) return;
    const liked = record.likedBy.includes(myUid);
    try {
      await updateDoc(doc(db, "community", record.id), {
        likedBy:   liked ? arrayRemove(myUid) : arrayUnion(myUid),
        likeCount: increment(liked ? -1 : 1),
      });
    } catch (e) { console.error("좋아요 오류:", e); }
  }, [myUid]);

  // ── 위시 추가 ─────────────────────────────────────────
  const handleWish = useCallback(async (record: ReturnType<typeof toRecord>) => {
    if (!coupleId || !myUid || !myName) return;
    if (wishedIds.has(record.id)) {
      setToast("이미 위시리스트에 추가했어요 ⭐");
      return;
    }
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
      setWishedIds(prev => new Set([...prev, record.id]));
      setToast("⭐ 위시리스트에 추가했어요!");
    } catch (e) {
      console.error("위시 오류:", e);
      setToast("❌ 추가에 실패했어요.");
    }
  }, [coupleId, myUid, myName, wishedIds, firebaseWish]);

  // ── 신고 ─────────────────────────────────────────────────
  const handleReport = useCallback(async (record: ReturnType<typeof toRecord>) => {
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

  return (
    <AppShell activeTab="community">
      <div style={{ padding: "16px 0" }}>
        <div style={{ margin: "0 16px 16px", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
          💡 커플들이 공유한 맛집이에요. 글쓰기 시 <strong>커뮤니티 공유</strong>를 켜면 여기에 올라와요.
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 260, background: WARM, borderRadius: 16, opacity: 0.6 }} />
            ))}
          </div>
        )}

        {!loading && records.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px", gap: 12 }}>
            <div style={{ fontSize: 56 }}>🌐</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: INK }}>아직 공유된 맛집이 없어요</div>
            <div style={{ fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 1.6 }}>
              다녀온 곳을 기록할 때<br />커뮤니티 공유를 켜면 여기에 올라와요!
            </div>
          </div>
        )}

        {!loading && records.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", padding: "0 16px" }}>
            {records.map((record) => (
              <CommunityCard
                key={record.id}
                record={record}
                isLiked={!!myUid && record.likedBy.includes(myUid)}   // ★
                isWished={wishedIds.has(record.id)}                    // ★
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
          onConfirm={() => submitReport(reportTarget)}
          onClose={() => setReportTarget(null)}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
