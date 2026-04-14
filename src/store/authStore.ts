// ============================================================
//  authStore.ts  적용 경로: src/store/authStore.ts
// ============================================================
import { create }             from "zustand";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc }        from "firebase/firestore";
import { auth, db }           from "@/lib/firebase/config";

interface AuthState {
  myUid:           string;
  myName:          string;
  partnerName:     string;
  startDate:       string;
  coupleId:        string | null;
  role:            "admin" | "user";
  initialized:     boolean;
  profileImgUrl:   string | null;

  setAuth:          (data: Partial<Omit<AuthState, "setAuth" | "setProfileImgUrl" | "setCoupleId" | "setStartDate" | "reset">>) => void;
  setProfileImgUrl: (url: string)  => void;
  setCoupleId:      (id: string)   => void;
  setStartDate:     (date: string) => void;
  reset:            () => void;
}

const initialState = {
  myUid:         "",
  myName:        "",
  partnerName:   "",
  startDate:     "",
  coupleId:      null,
  role:          "user" as const,
  initialized:   false,
  profileImgUrl: null,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setAuth:          (data) => set((s) => ({ ...s, ...data })),
  setProfileImgUrl: (url)  => set({ profileImgUrl: url }),
  setCoupleId:      (id)   => set({ coupleId: id }),
  setStartDate:     (date) => set({ startDate: date }),
  reset:            ()     => set({ ...initialState, initialized: true }),
}));

// ── Firebase Auth 상태 감지
// providers.tsx 호출 방식: setupAuthListener().then(unsub => { unsubscribe = unsub })
// → Promise<() => void> 반환
export function setupAuthListener(): Promise<() => void> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        useAuthStore.getState().reset();
        // 최초 1회 resolve (unsubscribe 함수 전달)
        resolve(unsubscribe);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.exists() ? userSnap.data() : {};

        let partnerName = "";
        let startDate   = "";

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
                partnerName = partnerSnap.data().name ?? "";
              }
            }
          }
        }

        useAuthStore.getState().setAuth({
          myUid:         user.uid,
          myName:        userData.name          ?? user.displayName ?? "",
          partnerName,
          startDate,
          coupleId:      userData.coupleId      ?? null,
          role:          userData.role          ?? "user",
          profileImgUrl: userData.profileImgUrl ?? user.photoURL   ?? null,
          initialized:   true,
        });
      } catch (err) {
        console.error("setupAuthListener error:", err);
        useAuthStore.getState().setAuth({ initialized: true });
      }

      resolve(unsubscribe);
    });
  });
}
