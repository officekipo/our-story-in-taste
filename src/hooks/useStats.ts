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
  const setStats = useStatsStore((s) => s.setStats);

  // ── visited 실시간 구독 ─────────────────────────────────
  useEffect(() => {
    if (!coupleId) return;

    const q = query(
      collection(db, "visited"),
      where("coupleId", "==", coupleId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => d.data());
      const visitedCount = docs.length;
      const avgRating =
        visitedCount > 0
          ? Math.round(
              (docs.reduce((sum, d) => sum + (d.rating ?? 0), 0) /
                visitedCount) *
                10
            ) / 10
          : 0;

      // wishCount 는 wishlist 구독에서 최신값을 가져오므로 덮어쓰지 않음
      setStats({ visitedCount, avgRating });
    });

    return () => unsub();
  }, [coupleId, setStats]);

  // ── wishlist 실시간 구독 ────────────────────────────────
  useEffect(() => {
    if (!coupleId) return;

    const q = query(
      collection(db, "wishlist"),
      where("coupleId", "==", coupleId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setStats({ wishCount: snap.size });
    });

    return () => unsub();
  }, [coupleId, setStats]);
}
