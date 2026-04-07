// src/store/authStore.ts

import { create } from "zustand";
import type { UserRole } from "@/types";

interface AuthState {
  myUid: string;
  myName: string;
  partnerName: string;
  startDate: string;
  coupleId: string | null;
  role: UserRole;
  initialized: boolean;

  setMyUid: (uid: string) => void;
  setMyName: (name: string) => void;
  setPartnerName: (name: string) => void;
  setStartDate: (date: string) => void;
  setCoupleId: (id: string | null) => void;
  setRole: (role: UserRole) => void;
  setInitialized: (v: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  myUid: "",
  myName: "",
  partnerName: "",
  startDate: "",
  coupleId: null,
  role: "user",
  initialized: false, // false → 로딩 스피너 표시

  setMyUid: (myUid) => set({ myUid }),
  setMyName: (myName) => set({ myName }),
  setPartnerName: (partnerName) => set({ partnerName }),
  setStartDate: (startDate) => set({ startDate }),
  setCoupleId: (coupleId) => set({ coupleId }),
  setRole: (role) => set({ role }),
  setInitialized: (initialized) => set({ initialized }),
  reset: () =>
    set({
      myUid: "",
      myName: "",
      partnerName: "",
      startDate: "",
      coupleId: null,
      role: "user",
      initialized: false,
    }),
}));

// ══════════════════════════════════════════════════════
//  setupAuthListener
//  providers.tsx useEffect 에서 앱 시작 시 한 번 호출
//  Firebase Auth 상태 변화를 감지해 authStore 자동 업데이트
// ══════════════════════════════════════════════════════
export async function setupAuthListener() {
  const { initAuthListener, fetchUser, fetchCouple } =
    await import("@/lib/firebase/auth");

  return initAuthListener(async (firebaseUser) => {
    const store = useAuthStore.getState();

    if (!firebaseUser) {
      // 로그아웃 — 스토어 초기화
      store.reset();
      store.setInitialized(true);
      return;
    }

    // Firestore 유저 정보 로드
    const user = await fetchUser(firebaseUser.uid);
    if (!user) {
      store.setInitialized(true);
      return;
    }

    store.setMyUid(user.uid);
    store.setMyName(user.name);
    store.setCoupleId(user.coupleId);
    store.setRole(user.role ?? "user");

    // 커플 정보 로드
    if (user.coupleId) {
      const couple = await fetchCouple(user.coupleId);
      if (couple) {
        store.setStartDate(couple.startDate);
        const partnerUid =
          couple.user1Uid === firebaseUser.uid
            ? couple.user2Uid
            : couple.user1Uid;
        if (partnerUid) {
          const partner = await fetchUser(partnerUid);
          if (partner) store.setPartnerName(partner.name);
        }
      }
    }

    store.setInitialized(true);
  });
}
