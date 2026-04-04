// src/store/authStore.ts
// 변수명 기준 (전체 파일 공통):
//   myUid        내 Firebase Auth UID
//   myName       내 닉네임
//   partnerName  파트너 닉네임
//   startDate    교제 시작일 "YYYY-MM-DD"
//   coupleId     Firestore couples 문서 ID (null = 미연동)
//   role         회원 등급 "admin" | "user"
//   initialized  Firebase Auth 초기화 완료 여부
//
// ── 더미 데이터 제거 시점 ──
//   Firebase 연동 완료 후 아래 defaultValues를 빈 값으로 바꾸고
//   providers.tsx에서 setupAuthListener()를 호출하면 됩니다.

import { create }  from "zustand";
import type { UserRole } from "@/types";

interface AuthState {
  myUid:       string;
  myName:      string;
  partnerName: string;
  startDate:   string;
  coupleId:    string | null;
  role:        UserRole;
  initialized: boolean;

  setMyUid:       (uid: string)        => void;
  setMyName:      (name: string)       => void;
  setPartnerName: (name: string)       => void;
  setStartDate:   (date: string)       => void;
  setCoupleId:    (id: string | null)  => void;
  setRole:        (role: UserRole)     => void;
  setInitialized: (v: boolean)         => void;
  reset:          ()                   => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // ──────────────────────────────────────────────────────
  // Firebase 연동 전: 아래 샘플값으로 UI 개발
  // Firebase 연동 후: 아래 6줄을 빈 값으로 교체
  //   myUid: "",  myName: "",  partnerName: "",
  //   startDate: "",  coupleId: null,  initialized: false,
  // ──────────────────────────────────────────────────────
  myUid:       "sample-uid-me",
  myName:      "치즈",
  partnerName: "민준",
  startDate:   "2023-03-28",
  coupleId:    "sample-couple-001",
  role:        "user",
  initialized: true,

  setMyUid:       (myUid)       => set({ myUid }),
  setMyName:      (myName)      => set({ myName }),
  setPartnerName: (partnerName) => set({ partnerName }),
  setStartDate:   (startDate)   => set({ startDate }),
  setCoupleId:    (coupleId)    => set({ coupleId }),
  setRole:        (role)        => set({ role }),
  setInitialized: (initialized) => set({ initialized }),
  reset: () => set({
    myUid: "", myName: "", partnerName: "",
    startDate: "", coupleId: null,
    role: "user", initialized: false,
  }),
}));

// ══════════════════════════════════════════════════════
//  setupAuthListener
//  Firebase Auth 상태 변화를 감지해서 authStore를 자동 업데이트
//  providers.tsx의 useEffect에서 한 번만 호출합니다.
//
//  Firebase 연동 완료 후 아래 주석을 해제하고
//  authStore 샘플값을 빈 값으로 교체하세요.
// ══════════════════════════════════════════════════════
export async function setupAuthListener() {
  // Step 06 Firebase Auth 연동 전까지 아무것도 하지 않음
  // 연동 후 아래 코드를 활성화하세요.

  /*
  const { initAuthListener, fetchUser, fetchCouple } = await import("@/lib/firebase/auth");

  return initAuthListener(async (firebaseUser) => {
    const store = useAuthStore.getState();

    if (!firebaseUser) {
      // 로그아웃 상태 — 스토어 초기화
      store.reset();
      store.setInitialized(true);
      return;
    }

    // Firestore에서 유저 정보 로드
    const user = await fetchUser(firebaseUser.uid);
    if (!user) { store.setInitialized(true); return; }

    store.setMyUid(user.uid);
    store.setMyName(user.name);
    store.setCoupleId(user.coupleId);
    store.setRole(user.role ?? "user");

    // 커플 정보 로드
    if (user.coupleId) {
      const couple = await fetchCouple(user.coupleId);
      if (couple) {
        store.setStartDate(couple.startDate);

        const partnerUid = couple.user1Uid === firebaseUser.uid
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
  */

  // 더미 모드: 즉시 initialized = true 처리
  useAuthStore.getState().setInitialized(true);
  return () => {};
}
