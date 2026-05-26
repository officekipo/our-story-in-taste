// src/store/authStore.ts
//
//  Fix:
//    ★ 커플 연동/해제 실시간 반영
//      - setupAuthListener에서 coupleId 확인 후 couples 문서 onSnapshot 구독
//      - 파트너 정보 변경(연동/해제) 시 authStore 자동 업데이트
//      - coupleId null 변경 시 파트너 정보 즉시 초기화
//    ★ Google 첫 로그인 타이밍 이슈 수정
//      - onAuthStateChanged가 ensureUserDoc() 보다 먼저 실행될 수 있음
//      - userSnap 없을 때 1.5초 대기 후 재시도
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
function subscribeCoupleDoc(coupleId: string, myUid: string): () => void {
  return onSnapshot(doc(db, "couples", coupleId), async (snap) => {
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

    const partnerUid = coupleData.user1Uid === myUid
      ? coupleData.user2Uid
      : coupleData.user1Uid;

    if (!partnerUid) {
      useAuthStore.getState().setAuth({
        partnerName:          "",
        partnerProfileImgUrl: null,
        startDate,
      });
      return;
    }

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
  let unsubCouple: (() => void) | null = null;

  const unsubAuth = onAuthStateChanged(auth, async (user) => {
    unsubCouple?.();
    unsubCouple = null;

    if (!user) {
      useAuthStore.getState().reset();
      return;
    }

    try {
      let userSnap = await getDoc(doc(db, "users", user.uid));

      // ★ Google 첫 로그인 타이밍 이슈:
      //   handleGoogleRedirectResult()의 ensureUserDoc()보다
      //   onAuthStateChanged가 먼저 실행될 수 있음 → 1.5초 대기 후 재시도
      if (!userSnap.exists()) {
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));
        userSnap = await getDoc(doc(db, "users", user.uid));
      }

      // 재시도 후에도 없으면 (ensureUserDoc 실패 등) initialized만 true로 세팅 후 종료
      if (!userSnap.exists()) {
        console.warn("setupAuthListener: users 문서 없음 (uid:", user.uid, ")");
        useAuthStore.getState().setAuth({ initialized: true });
        return;
      }

      const userData = userSnap.data();

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

  return () => {
    unsubAuth();
    unsubCouple?.();
  };
}
