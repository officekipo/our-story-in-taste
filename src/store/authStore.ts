// src/store/authStore.ts
//
//  Fix:
//    ★ 커플 연동/해제 실시간 반영
//      - setupAuthListener에서 coupleId 확인 후 couples 문서 onSnapshot 구독
//      - 파트너 정보 변경(연동/해제) 시 authStore 자동 업데이트
//      - coupleId null 변경 시 파트너 정보 즉시 초기화
import { create }                          from "zustand";
import { onAuthStateChanged }              from "firebase/auth";
import { doc, getDoc, onSnapshot }         from "firebase/firestore";
import { auth, db }                        from "@/lib/firebase/config";

interface AuthState {
  myUid:                string;
  myName:               string;
  partnerName:          string;
  partnerProfileImgUrl: string | null;
  startDate:            string;
  coupleId:             string | null;
  role:                 "admin" | "user";
  initialized:          boolean;
  profileImgUrl:        string | null;
  fcmToken:             string | null;
  emailVerified:        boolean;

  setAuth:                 (data: Partial<Omit<AuthState, "setAuth" | "setProfileImgUrl" | "setPartnerProfileImgUrl" | "setCoupleId" | "setStartDate" | "setFcmToken" | "setEmailVerified" | "reset">>) => void;
  setProfileImgUrl:        (url: string) => void;
  setPartnerProfileImgUrl: (url: string | null) => void;
  setCoupleId:             (id: string | null) => void;
  setStartDate:            (date: string) => void;
  setFcmToken:             (token: string | null) => void;
  setEmailVerified:        (v: boolean) => void;
  reset:                   () => void;
}

const initialState = {
  myUid:                "",
  myName:               "",
  partnerName:          "",
  partnerProfileImgUrl: null,
  startDate:            "",
  coupleId:             null,
  role:                 "user" as const,
  initialized:          false,
  profileImgUrl:        null,
  fcmToken:             null,
  emailVerified:        false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setAuth:                 (data) => set((s) => ({ ...s, ...data })),
  setProfileImgUrl:        (url)   => set({ profileImgUrl: url }),
  setPartnerProfileImgUrl: (url)   => set({ partnerProfileImgUrl: url }),
  setCoupleId:             (id)    => set({ coupleId: id }),
  setStartDate:            (date)  => set({ startDate: date }),
  setFcmToken:             (token) => set({ fcmToken: token }),
  setEmailVerified:        (v)     => set({ emailVerified: v }),
  reset:                   ()      => set({ ...initialState, initialized: true }),
}));

// ── 커플 문서 실시간 리스너 ────────────────────────────────
// 반환값: unsubscribe 함수
function subscribeCoupleDoc(coupleId: string, myUid: string): () => void {
  return onSnapshot(doc(db, "couples", coupleId), async (snap) => {
    // 커플 문서가 삭제됨 → 해제 처리
    if (!snap.exists()) {
      useAuthStore.getState().setAuth({
        coupleId:             null,
        partnerName:          "",
        partnerProfileImgUrl: null,
        startDate:            "",
      });
      return;
    }

    const coupleData = snap.data();
    const startDate  = coupleData.startDate ?? "";

    // user2Uid가 없으면 파트너 미연동 상태
    const partnerUid = coupleData.user1Uid === myUid
      ? coupleData.user2Uid
      : coupleData.user1Uid;

    if (!partnerUid) {
      // 파트너 미연동 — 파트너 정보 초기화
      useAuthStore.getState().setAuth({
        partnerName:          "",
        partnerProfileImgUrl: null,
        startDate,
      });
      return;
    }

    // 파트너 정보 조회
    try {
      const partnerSnap = await getDoc(doc(db, "users", partnerUid));
      if (partnerSnap.exists()) {
        const partnerData = partnerSnap.data();
        useAuthStore.getState().setAuth({
          partnerName:          partnerData.name          ?? "",
          partnerProfileImgUrl: partnerData.profileImgUrl ?? null,
          startDate,
        });
      }
    } catch (err) {
      console.error("subscribeCoupleDoc partnerSnap error:", err);
    }
  });
}

// ── Firebase Auth 상태 감지 ────────────────────────────────
export function setupAuthListener(): () => void {
  let unsubCouple: (() => void) | null = null; // 커플 문서 리스너

  const unsubAuth = onAuthStateChanged(auth, async (user) => {
    // 이전 커플 리스너 해제
    unsubCouple?.();
    unsubCouple = null;

    if (!user) {
      useAuthStore.getState().reset();
      return;
    }

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};

      let partnerName          = "";
      let partnerProfileImgUrl: string | null = null;
      let startDate            = "";

      if (userData.coupleId) {
        const coupleSnap = await getDoc(doc(db, "couples", userData.coupleId));
        if (coupleSnap.exists()) {
          const coupleData = coupleSnap.data();
          startDate = coupleData.startDate ?? "";

          const partnerUid = coupleData.user1Uid === user.uid
            ? coupleData.user2Uid
            : coupleData.user1Uid;

          if (partnerUid) {
            const partnerSnap = await getDoc(doc(db, "users", partnerUid));
            if (partnerSnap.exists()) {
              const partnerData    = partnerSnap.data();
              partnerName          = partnerData.name          ?? "";
              partnerProfileImgUrl = partnerData.profileImgUrl ?? null;
            }
          }
        }

        // ★ 커플 문서 실시간 구독 시작
        unsubCouple = subscribeCoupleDoc(userData.coupleId, user.uid);
      }

      useAuthStore.getState().setAuth({
        myUid:                user.uid,
        myName:               userData.name          ?? user.displayName ?? "",
        partnerName,
        partnerProfileImgUrl,
        startDate,
        coupleId:             userData.coupleId      ?? null,
        role:                 userData.role          ?? "user",
        profileImgUrl:        userData.profileImgUrl ?? user.photoURL   ?? null,
        initialized:          true,
        emailVerified:        user.emailVerified,
      });
    } catch (err) {
      console.error("setupAuthListener error:", err);
      useAuthStore.getState().setAuth({ initialized: true });
    }
  });

  // auth + couple 리스너 모두 해제
  return () => {
    unsubAuth();
    unsubCouple?.();
  };
}
