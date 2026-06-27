// ============================================================
//  useStats.ts
//  적용 경로: src/hooks/useStats.ts
//
//  역할:
//    - Firestore visited + wishlist 를 실시간 구독
//    - visitedCount / avgRating / wishCount 를 statsStore 에 자동 반영
//    - AppShell 또는 providers.tsx 에서 1회 마운트하면
//      모든 탭의 Header 통계가 항상 최신 상태 유지
//
//  사용법 (AppShell.tsx 또는 providers.tsx 에 추가):
//    useStats();
// ============================================================

"use client";

import { useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuthStore } from "@/store/authStore";
import { useStatsStore } from "@/store/statsStore";

export function useStats() {
  const coupleId = useAuthStore((s) => s.coupleId);
  const myUid    = useAuthStore((s) => s.myUid);
  const setStats = useStatsStore((s) => s.setStats);

  // ── visited 실시간 구독 ─────────────────────────────────
  // ★ coupleId 있으면 커플 전체, 없으면 본인(authorUid) 기준 fallback
  useEffect(() => {
    if (!myUid) return;

    const q = coupleId
      ? query(collection(db, "visited"), where("coupleId", "==", coupleId))
      : query(collection(db, "visited"), where("authorUid", "==", myUid));

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => d.data());
      const visitedCount = docs.length;
      // ★ number로 저장 (statsStore 타입 호환) — 표시는 Header에서 toFixed(1)
      const avgRating = visitedCount > 0
        ? Math.round((docs.reduce((sum, d) => sum + (d.rating ?? 0), 0) / visitedCount) * 10) / 10
        : 0;
      setStats({ visitedCount, avgRating });
    });

    return () => unsub();
  }, [coupleId, myUid, setStats]);

  // ── wishlist 실시간 구독 ────────────────────────────────
  // ★ coupleId 있으면 커플 전체, 없으면 본인(addedByUid) 기준 fallback
  useEffect(() => {
    if (!myUid) return;

    const q = coupleId
      ? query(collection(db, "wishlist"), where("coupleId", "==", coupleId))
      : query(collection(db, "wishlist"), where("addedByUid", "==", myUid));

    const unsub = onSnapshot(q, (snap) => {
      setStats({ wishCount: snap.size });
    });

    return () => unsub();
  }, [coupleId, myUid, setStats]);
}
