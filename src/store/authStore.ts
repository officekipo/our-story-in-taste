// src/store/authStore.ts
// 변수명 기준 (전체 파일 공통):
//   myUid        내 Firebase Auth UID
//   myName       내 닉네임
//   partnerName  파트너 닉네임
//   startDate    교제 시작일 "YYYY-MM-DD"
//   coupleId     Firestore couples 문서 ID
//   role         회원 등급 "admin" | "user"
//   initialized  Firebase Auth 초기화 완료 여부

import { create } from "zustand";
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
  // Firebase Auth 연동 전 임시 샘플값
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
  reset: () => set({ myUid: "", myName: "", partnerName: "", startDate: "", coupleId: null, role: "user", initialized: false }),
}));
