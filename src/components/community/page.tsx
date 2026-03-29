"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CommunityCard } from "@/components/community/CommunityCard";
import { ReportModal } from "@/components/community/ReportModal";
import { Toast } from "@/components/common/Toast";
import { SAMPLE_COMMUNITY, SAMPLE_WISHLIST, ME_NAME } from "@/lib/sample-data";
import type { CommunityRecord } from "@/types";
export default function CommunityPage() {
  const [records, setRecords] = useState<CommunityRecord[]>(SAMPLE_COMMUNITY);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [wished, setWished] = useState<Set<string>>(new Set());
  const [reported, setReported] = useState<string | null>(null); // 신고 모달 대상 ID
  const [toast, setToast] = useState<string | null>(null);
  const handleWish = (id: string, name: string) => {
    if (wished.has(id)) {
      setToast("이미 위시리스트에 있어요 ");
      return;
    }
    setWished((p) => new Set([...p, id]));
    setToast(`⭐ "${name}" 위시리스트에 추가했어요!`);
  };
  const toggleLike = (id: string) => {
    setLiked((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  return (
    <AppShell
      activeTab="community"
      headerProps={{ visitedCount: 6, avgRating: "4.5", wishCount: 3 }}
    >
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-xl font-extrabold text-ink">
          다른 커플들의 추천 맛집
        </h2>
        <p className="text-sm text-muted mt-1">
          사랑하는 사람과 함께 가면 좋을 곳들이에요{" "}
        </p>
      </div>
      <div className="px-4">
        {records
          .filter((r) => !r.coupleId.startsWith("reported-"))
          .map((r) => (
            <CommunityCard
              key={r.id}
              record={r}
              isLiked={liked.has(r.id)}
              isWished={wished.has(r.id)}
              onLike={() => toggleLike(r.id)}
              onWish={() => handleWish(r.id, r.name)}
              onReport={() => setReported(r.id)}
            />
          ))}
      </div>
      {/* 신고 모달 */}
      {reported && (
        <ReportModal
          onClose={() => setReported(null)}
          onReport={() => {
            setRecords((p) =>
              p.map((r) =>
                r.id === reported
                  ? { ...r, coupleId: "reported-" + r.coupleId }
                  : r,
              ),
            );
            setReported(null);
            setToast("신고가 접수됐어요. 검토 후 조치합니다.");
          }}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
