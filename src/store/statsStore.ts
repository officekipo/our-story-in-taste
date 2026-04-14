// ============================================================
//  statsStore.ts
//  적용 경로: src/store/statsStore.ts
//
//  변경사항:
//    setStats() 가 Partial 업데이트를 지원하도록 수정
//    → visited 구독과 wishlist 구독이 서로 덮어쓰지 않음
// ============================================================

import { create } from "zustand";

interface StatsState {
  visitedCount: number;
  avgRating: number;
  wishCount: number;
  setStats: (partial: Partial<Omit<StatsState, "setStats">>) => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  visitedCount: 0,
  avgRating: 0,
  wishCount: 0,
  setStats: (partial) => set((prev) => ({ ...prev, ...partial })),
}));
