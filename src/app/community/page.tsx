// src/app/community/page.tsx
"use client";

import { useState }           from "react";
import { AppShell }           from "@/components/layout/AppShell";
import { CommunityCard }      from "@/components/community/CommunityCard";
import { ReportModal }        from "@/components/community/ReportModal";
import { Toast }              from "@/components/common/Toast";
import { useAuthStore }       from "@/store/authStore";
import { SAMPLE_COMMUNITY, SAMPLE_WISHLIST } from "@/lib/sample-data";
import type { CommunityRecord, WishRecord } from "@/types";

export default function CommunityPage() {
  const { myName }    = useAuthStore();
  const [records,    setRecords]  = useState<CommunityRecord[]>(SAMPLE_COMMUNITY);
  const [liked,      setLiked]    = useState<Set<string>>(new Set());
  const [wished,     setWished]   = useState<Set<string>>(new Set());
  const [reportId,   setReportId] = useState<string | null>(null);
  const [toast,      setToast]    = useState<string | null>(null);
  const [wishlist,   setWishlist] = useState<WishRecord[]>(SAMPLE_WISHLIST);

  const toggleLike = (id: string) => {
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleWish = (id: string, name: string) => {
    if (wished.has(id)) { setToast("이미 위시리스트에 있어요 😊"); return; }
    setWished(prev => new Set([...prev, id]));
    const rec = records.find(r => r.id === id);
    if (rec) {
      const newWish: WishRecord = {
        id:          Date.now().toString(),
        coupleId:    "sample-couple-001",
        name:        rec.name,
        sido:        rec.sido,
        district:    rec.district,
        cuisine:     rec.cuisine,
        note:        rec.memo,
        addedByUid:  "uid-me",
        addedByName: myName,
        emoji:       rec.emoji,
        addedDate:   new Date().toISOString().slice(0, 10),
      };
      setWishlist(prev => [newWish, ...prev]);
    }
    setToast(`⭐ "${name}" 위시리스트에 추가했어요!`);
  };

  return (
    <AppShell activeTab="community" headerProps={{ visitedCount: 6, avgRating: "4.5", wishCount: wishlist.length }}>
      <div style={{ padding: "20px 20px 12px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1A1412", marginBottom: 4 }}>다른 커플들의 추천 맛집</h2>
        <p style={{ fontSize: 13, color: "#8A8078" }}>사랑하는 사람과 함께 가면 좋을 곳들이에요 💕</p>
      </div>

      <div style={{ padding: "0 16px" }}>
        {records
          .filter(r => !r.id.startsWith("reported-"))
          .map(r => (
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
      </div>

      {reportId && (
        <ReportModal
          onClose={() => setReportId(null)}
          onReport={() => {
            setRecords(prev => prev.map(r => r.id === reportId ? { ...r, id: "reported-" + r.id } : r));
            setReportId(null);
            setToast("신고가 접수됐어요. 검토 후 조치합니다.");
          }}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
