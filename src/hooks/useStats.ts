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
//  버그 수정 (2026-06-26):
//    ★ coupleId 생성 직후(코드 만들기 후 파트너 미연동 상태) 통계가 0이 되는 버그 수정
//      원인: coupleId가 생기면 authorUid 구독을 끊고 coupleId 구독으로 전환하는데,
//            이 시점 Firestore의 visited 문서들은 coupleId가 아직 ""이라
//            where("coupleId","==",newCoupleId) 쿼리 결과가 0건 반환됨
//            (Cloud Functions onCoupleJoined가 coupleId를 채우기 전까지)
//      해결: useVisited와 동일하게 authorUid 구독과 coupleId 구독을 동시에 유지하고
//            id 기준으로 합산(중복 제거)하여 항상 정확한 통계를 표시
//
//  사용법 (AppShell.tsx 에 추가):
//    useStats();
// ============================================================

"use client";

import { useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db }            from "@/lib/firebase/config";
import { useAuthStore }  from "@/store/authStore";
import { useStatsStore } from "@/store/statsStore";

export function useStats() {
  const coupleId = useAuthStore((s) => s.coupleId);
  const myUid    = useAuthStore((s) => s.myUid);
  const setStats = useStatsStore((s) => s.setStats);

  // ── visited: authorUid + coupleId 동시 구독 후 합산 ────────────────────
  // ★ useVisited와 동일한 전략:
  //   - authorUid 구독: 내 글은 coupleId 값과 무관하게 항상 포함
  //   - coupleId 구독: 연동 중일 때 파트너 글 추가
  //   - id 기준 Map으로 합산 → 중복 제거
  //   → coupleId 생성 직후 Firestore의 내 글 coupleId 필드가 아직 ""이어도
  //     authorUid 구독이 살아있어 통계가 0이 되지 않음
  const authorVisitedRef = useRef<Map<string, DocumentData>>(new Map());
  const coupleVisitedRef = useRef<Map<string, DocumentData>>(new Map());

  // authorUid 기준 visited 구독 (항상 유지)
  useEffect(() => {
    if (!myUid) return;

    const q     = query(collection(db, "visited"), where("authorUid", "==", myUid));
    const unsub = onSnapshot(q, (snap) => {
      const map = new Map<string, DocumentData>();
      snap.docs.forEach((d) => map.set(d.id, d.data()));
      authorVisitedRef.current = map;
      calcAndSetVisitedStats();
    });

    return () => {
      authorVisitedRef.current = new Map();
      unsub();
    };
  }, [myUid]); // eslint-disable-line react-hooks/exhaustive-deps

  // coupleId 기준 visited 구독 (coupleId 있을 때만)
  useEffect(() => {
    if (!coupleId) {
      coupleVisitedRef.current = new Map();
      // coupleId가 없어진 경우 authorUid 구독 데이터만으로 재계산
      calcAndSetVisitedStats();
      return;
    }

    const q     = query(collection(db, "visited"), where("coupleId", "==", coupleId));
    const unsub = onSnapshot(q, (snap) => {
      const map = new Map<string, DocumentData>();
      snap.docs.forEach((d) => map.set(d.id, d.data()));
      coupleVisitedRef.current = map;
      calcAndSetVisitedStats();
    });

    return () => {
      coupleVisitedRef.current = new Map();
      unsub();
    };
  }, [coupleId]); // eslint-disable-line react-hooks/exhaustive-deps

  function calcAndSetVisitedStats() {
    // id 기준 합산 — 내 글이 양쪽에 걸려도 중복 제거
    const merged = new Map<string, DocumentData>([
      ...coupleVisitedRef.current,
      ...authorVisitedRef.current, // authorUid 우선
    ]);
    const docs         = Array.from(merged.values());
    const visitedCount = docs.length;
    const avgRating    = visitedCount > 0
      ? Math.round(
          (docs.reduce((sum, d) => sum + (d.rating ?? 0), 0) / visitedCount) * 10
        ) / 10
      : 0;
    setStats({ visitedCount, avgRating });
  }

  // ── wishlist: authorUid + coupleId 동시 구독 후 합산 ───────────────────
  const authorWishRef = useRef<Set<string>>(new Set());
  const coupleWishRef = useRef<Set<string>>(new Set());

  // addedByUid 기준 wishlist 구독 (항상 유지)
  useEffect(() => {
    if (!myUid) return;

    const q     = query(collection(db, "wishlist"), where("addedByUid", "==", myUid));
    const unsub = onSnapshot(q, (snap) => {
      authorWishRef.current = new Set(snap.docs.map((d) => d.id));
      calcAndSetWishCount();
    });

    return () => {
      authorWishRef.current = new Set();
      unsub();
    };
  }, [myUid]); // eslint-disable-line react-hooks/exhaustive-deps

  // coupleId 기준 wishlist 구독 (coupleId 있을 때만)
  useEffect(() => {
    if (!coupleId) {
      coupleWishRef.current = new Set();
      calcAndSetWishCount();
      return;
    }

    const q     = query(collection(db, "wishlist"), where("coupleId", "==", coupleId));
    const unsub = onSnapshot(q, (snap) => {
      coupleWishRef.current = new Set(snap.docs.map((d) => d.id));
      calcAndSetWishCount();
    });

    return () => {
      coupleWishRef.current = new Set();
      unsub();
    };
  }, [coupleId]); // eslint-disable-line react-hooks/exhaustive-deps

  function calcAndSetWishCount() {
    const merged   = new Set([...authorWishRef.current, ...coupleWishRef.current]);
    setStats({ wishCount: merged.size });
  }
}
