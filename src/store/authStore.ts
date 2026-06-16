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
//    ★ 닉네임 20자 truncate
//      - 구글 displayName이 20자 초과 시 앞 20자만 저장
//    ★ profileCompleted Firestore 필드 추가
//      - sessionStorage 대신 Firestore users 문서의 profileCompleted 필드로 팝업 억제
//      - PWA 재실행·기기 교체에도 팝업 재노출 없음
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
  // ★ 프로필 완성 여부 (Firestore users 문서의 profileCompleted 필드)
  profileCompleted:     boolean;

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
  profileCompleted:     false,
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

// ★ 닉네임 20자 truncate 유틸
function truncateName(name: string): string {
  return name.length > 20 ? name.slice(0, 20) : name;
}

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
          partnerName:          truncateName(partnerData.name ?? ""),
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
  let unsubUser:   (() => void) | null = null;
  let unsubCouple: (() => void) | null = null;

  const unsubAuth = onAuthStateChanged(auth, async (user) => {
    // 이전 구독 전부 해제
    unsubCouple?.();
    unsubCouple = null;
    unsubUser?.();
    unsubUser = null;

    if (!user) {
      useAuthStore.getState().reset();
      return;
    }

    // ★ Google 첫 로그인 타이밍: users 문서가 아직 없으면 1.5초 대기 후 구독 시작
    const initialSnap = await getDoc(doc(db, "users", user.uid));
    if (!initialSnap.exists()) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
    }

    unsubUser = onSnapshot(doc(db, "users", user.uid), async (userSnap) => {
      if (!userSnap.exists()) {
        console.warn("setupAuthListener: users 문서 없음 (uid:", user.uid, ")");
        useAuthStore.getState().setAuth({ initialized: true });
        return;
      }

      const userData    = userSnap.data();
      const newCoupleId: string | null = userData.coupleId ?? null;

      // coupleId가 바뀐 경우에만 couples 구독을 재설정
      const prevCoupleId = useAuthStore.getState().coupleId;
      if (newCoupleId !== prevCoupleId) {
        unsubCouple?.();
        unsubCouple = null;
        if (newCoupleId) {
          unsubCouple = subscribeCoupleDoc(newCoupleId, user.uid);
        } else {
          // coupleId가 null이 됐을 때 파트너 정보 즉시 초기화
          useAuthStore.getState().setAuth({
            coupleId:             null,
            partnerName:          "",
            partnerProfileImgUrl: null,
            startDate:            "",
          });
        }
      }

      // ★ 닉네임 truncate 적용 (구글 displayName이 20자 초과할 수 있음)
      const rawName = userData.name ?? user.displayName ?? "";
      const myName  = truncateName(rawName);

      useAuthStore.getState().setAuth({
        myUid:            user.uid,
        myName,
        coupleId:         newCoupleId,
        role:             userData.role             ?? "user",
        profileImgUrl:    userData.profileImgUrl    ?? user.photoURL ?? null,
        initialized:      true,
        emailVerified:    user.emailVerified,
        // ★ Firestore의 profileCompleted 필드를 store에 반영
        //   없는 필드면 false (기존 가입자도 팝업이 한 번 뜬 후 저장됨)
        profileCompleted: userData.profileCompleted ?? false,
      });
    }, (err) => {
      console.error("setupAuthListener userSnap error:", err);
      useAuthStore.getState().setAuth({ initialized: true });
    });
  });

  return () => {
    unsubAuth();
    unsubCouple?.();
    unsubUser?.();
  };
}
