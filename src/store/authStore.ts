import { create } from "zustand";
import { fetchUser, fetchCouple, initAuthListener } from "@/lib/firebase/auth";
import type { User, Couple } from "@/types";
interface AuthState {
  /* 현재 로그인한 유저 정보 */
  user: User | null;
  /* 커플 정보 */
  couple: Couple | null;
  /* 파트너 유저 정보 */
  partner: User | null;
  /* Firebase Auth 초기화 완료 여부
false 동안은 로딩 스피너 표시 */
  initialized: boolean;
  /* 액션 */
  setUser: (u: User | null) => void;
  setCouple: (c: Couple | null) => void;
  setPartner: (p: User | null) => void;
  setInit: () => void;
  reset: () => void; // 로그아웃 시 초기화
}
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  couple: null,
  partner: null,
  initialized: false,
  setUser: (user) => set({ user }),
  setCouple: (couple) => set({ couple }),
  setPartner: (partner) => set({ partner }),
  setInit: () => set({ initialized: true }),
  reset: () => set({ user: null, couple: null, partner: null }),

  
  name: null,
  partnerName: null,
  dDayStart: null,
  avatarColor: null,
}));
/* ════════════════════════════
앱 시작 시 Firebase Auth 리스너 초기화
providers.tsx 의 useEffect에서 한 번만 호출합니다.
════════════════════════════ */
export async function setupAuthListener() {
  return initAuthListener(async (firebaseUser) => {
    const store = useAuthStore.getState();
    if (!firebaseUser) {
      // 로그아웃 상태
      store.reset();
      store.setInit();
      return;
    }
    // Firestore에서 유저 정보 불러오기
    const user = await fetchUser(firebaseUser.uid);
    if (!user) {
      store.setInit();
      return;
    }
    store.setUser(user);
    // 커플 정보 불러오기
    if (user.coupleId) {
      const couple = await fetchCouple(user.coupleId);
      if (couple) {
        store.setCouple(couple);
        // 파트너 유저 정보 불러오기
        const partnerUid =
          couple.user1 === firebaseUser.uid ? couple.user2 : couple.user1;
        if (partnerUid) {
          const partner = await fetchUser(partnerUid);
          store.setPartner(partner);
        }
      }
    }
    store.setInit();
  });
}
