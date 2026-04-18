// ============================================================
//  authStore.ts  적용 경로: src/store/authStore.ts
//
//  Fix: partnerProfileImgUrl 필드 추가
//    - setupAuthListener 에서 파트너 profileImgUrl 함께 조회
//    - Header 좌측 커플 아바타에 파트너 프로필 사진 표시 지원
// ============================================================
import { create }             from "zustand";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc }        from "firebase/firestore";
import { auth, db }           from "@/lib/firebase/config";

interface AuthState {
  myUid:                string;
  myName:               string;
  partnerName:          string;
  partnerProfileImgUrl: string | null;   // ★ 추가
  startDate:            string;
  coupleId:             string | null;
  role:                 "admin" | "user";
  initialized:          boolean;
  profileImgUrl:        string | null;

  setAuth:                 (data: Partial<Omit<AuthState, "setAuth" | "setProfileImgUrl" | "setPartnerProfileImgUrl" | "setCoupleId" | "setStartDate" | "reset">>) => void;
  setProfileImgUrl:        (url: string)  => void;
  setPartnerProfileImgUrl: (url: string | null) => void;  // ★ 추가
  setCoupleId:             (id: string)   => void;
  setStartDate:            (date: string) => void;
  reset:                   () => void;
}

const initialState = {
  myUid:                "",
  myName:               "",
  partnerName:          "",
  partnerProfileImgUrl: null,   // ★ 추가
  startDate:            "",
  coupleId:             null,
  role:                 "user" as const,
  initialized:          false,
  profileImgUrl:        null,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setAuth:                 (data) => set((s) => ({ ...s, ...data })),
  setProfileImgUrl:        (url)  => set({ profileImgUrl: url }),
  setPartnerProfileImgUrl: (url)  => set({ partnerProfileImgUrl: url }),  // ★ 추가
  setCoupleId:             (id)   => set({ coupleId: id }),
  setStartDate:            (date) => set({ startDate: date }),
  reset:                   ()     => set({ ...initialState, initialized: true }),
}));

// ── Firebase Auth 상태 감지
export function setupAuthListener(): Promise<() => void> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        useAuthStore.getState().reset();
        resolve(unsubscribe);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.exists() ? userSnap.data() : {};

        let partnerName          = "";
        let partnerProfileImgUrl: string | null = null;  // ★ 추가
        let startDate            = "";

        if (userData.coupleId) {
          const coupleSnap = await getDoc(doc(db, "couples", userData.coupleId));
          if (coupleSnap.exists()) {
            const coupleData = coupleSnap.data();
            startDate = coupleData.startDate ?? "";

            const partnerUid =
              coupleData.user1Uid === user.uid
                ? coupleData.user2Uid
                : coupleData.user1Uid;

            if (partnerUid) {
              const partnerSnap = await getDoc(doc(db, "users", partnerUid));
              if (partnerSnap.exists()) {
                const partnerData = partnerSnap.data();
                partnerName          = partnerData.name           ?? "";
                partnerProfileImgUrl = partnerData.profileImgUrl  ?? null;  // ★ 추가
              }
            }
          }
        }

        useAuthStore.getState().setAuth({
          myUid:                user.uid,
          myName:               userData.name          ?? user.displayName ?? "",
          partnerName,
          partnerProfileImgUrl,   // ★ 추가
          startDate,
          coupleId:             userData.coupleId      ?? null,
          role:                 userData.role          ?? "user",
          profileImgUrl:        userData.profileImgUrl ?? user.photoURL   ?? null,
          initialized:          true,
        });
      } catch (err) {
        console.error("setupAuthListener error:", err);
        useAuthStore.getState().setAuth({ initialized: true });
      }

      resolve(unsubscribe);
    });
  });
}
