// src/app/community/page.tsx
// DUMMY_MODE = true  → SAMPLE_COMMUNITY 사용
// DUMMY_MODE = false → Firestore community 컬렉션 사용 (Firebase 연동 후)
"use client";

import { useState }            from "react";
import { AppShell }            from "@/components/layout/AppShell";
import { CommunityCard }       from "@/components/community/CommunityCard";
import { ReportModal }         from "@/components/community/ReportModal";
import { Toast }               from "@/components/common/Toast";
import { useAuthStore }        from "@/store/authStore";
import { SAMPLE_COMMUNITY }    from "@/lib/sample-data";
import type { CommunityRecord, WishRecord } from "@/types";

// ── 전환 스위치 ──────────────────────────────────────────
const DUMMY_MODE = false;
// ────────────────────────────────────────────────────────

const ROSE  = "#C96B52";

export default function CommunityPage() {
  const { myName, coupleId } = useAuthStore();

  const [records,  setRecords]  = useState<CommunityRecord[]>(SAMPLE_COMMUNITY);
  const [liked,    setLiked]    = useState<Set<string>>(new Set());
  const [wished,   setWished]   = useState<Set<string>>(new Set());
  const [reportId, setReportId] = useState<string | null>(null);
  const [toast,    setToast]    = useState<string | null>(null);

  // 좋아요 토글
  const toggleLike = (id: string) => {
    setLiked(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // 위시 추가
  const handleWish = (id: string, name: string) => {
    if (wished.has(id)) {
      setToast("이미 위시리스트에 있어요 😊");
      return;
    }
    setWished(prev => new Set([...prev, id]));
    setToast(`⭐ "${name}" 위시리스트에 추가했어요!`);

    // TODO (Firebase 모드): Firestore wishlist에 저장
    // const rec = records.find(r => r.id === id);
    // if (rec && coupleId) {
    //   addWish(coupleId, myUid, myName, {
    //     name: rec.name, sido: rec.sido, district: rec.district,
    //     cuisine: rec.cuisine, note: rec.memo, emoji: rec.emoji,
    //   });
    // }
  };

  // 신고 처리
  const handleReport = () => {
    setRecords(prev =>
      prev.map(r => r.id === reportId ? { ...r, id: "reported-" + r.id } : r)
    );
    setReportId(null);
    setToast("신고가 접수됐어요. 검토 후 조치합니다.");
  };

  // 신고된 게시물 필터
  const visible = records.filter(r => !r.id.startsWith("reported-"));

  return (
    <AppShell
      activeTab="community"
      headerProps={{ visitedCount: 6, avgRating: "4.5", wishCount: 3 }}
    >
      <div style={{ padding: "20px 20px 12px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1A1412", marginBottom: 4 }}>
          다른 커플들의 추천 맛집
        </h2>
        <p style={{ fontSize: 13, color: "#8A8078" }}>
          사랑하는 사람과 함께 가면 좋을 곳들이에요 💕
        </p>
      </div>

      <div style={{ padding: "0 16px" }}>
        {visible.map(r => (
          <CommunityCard
            key={r.id}
            record={r}
            isLiked={liked.has(r.id)}
            isWished={wished.has(r.id)}
            onLike={() => toggleLike(r.id)}
            onWish={() => handleWish(r.id, r.name)}
            onReport={() => setReportId(r.id)}
          />
        ))}
        {visible.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#C0B8B0" }}>
            <div style={{ fontSize: 44 }}>💬</div>
            <p style={{ marginTop: 10, fontSize: 14 }}>추천 게시물이 없어요</p>
          </div>
        )}
      </div>

      {reportId && (
        <ReportModal
          onClose={() => setReportId(null)}
          onReport={handleReport}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
