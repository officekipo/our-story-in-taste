// src/store/authStore.ts
// 변수명 기준 (전체 파일 공통):
//   myUid        내 Firebase Auth UID
//   myName       내 닉네임
//   partnerName  파트너 닉네임
//   startDate    교제 시작일 "YYYY-MM-DD"
//   coupleId     Firestore couples 문서 ID
//   initialized  Firebase Auth 초기화 완료 여부

import { create } from "zustand";

interface AuthState {
  myUid:       string;
  myName:      string;
  partnerName: string;
  startDate:   string;
  coupleId:    string | null;
  initialized: boolean;
  setMyUid:       (uid: string)        => void;
  setMyName:      (name: string)       => void;
  setPartnerName: (name: string)       => void;
  setStartDate:   (date: string)       => void;
  setCoupleId:    (id: string | null)  => void;
  setInitialized: (v: boolean)         => void;
  reset:          ()                   => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Firebase Auth 연동(Step06) 전까지 사용하는 임시 샘플값
  myUid:       "sample-uid-me",
  myName:      "치즈",
  partnerName: "민준",
  startDate:   "2023-03-28",
  coupleId:    "sample-couple-001",
  initialized: true,

  setMyUid:       (myUid)       => set({ myUid }),
  setMyName:      (myName)      => set({ myName }),
  setPartnerName: (partnerName) => set({ partnerName }),
  setStartDate:   (startDate)   => set({ startDate }),
  setCoupleId:    (coupleId)    => set({ coupleId }),
  setInitialized: (initialized) => set({ initialized }),
  reset: () => set({ myUid: "", myName: "", partnerName: "", startDate: "", coupleId: null, initialized: false }),
}));
