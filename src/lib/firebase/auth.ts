// src/lib/firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, getDocFromServer, updateDoc,
  collection, query, where, getDocs, writeBatch,
  serverTimestamp, deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./config";
import type { AppUser, CoupleDoc } from "@/types";

// ★ 닉네임 DB 저장 한도: 20자
//   구글 계정 displayName이 길 경우 자동 truncate
const MAX_NAME_LENGTH = 20;
function truncateName(name: string): string {
  return name.length > MAX_NAME_LENGTH ? name.slice(0, MAX_NAME_LENGTH) : name;
}

/* ── 이메일 회원가입 ── */
export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<FirebaseUser> {
  const trimmed = truncateName(name.trim());
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: trimmed });
  await setDoc(doc(db, "users", user.uid), {
    uid:       user.uid,
    name:      trimmed,
    email,
    coupleId:  null,
    role:      "user",
    provider:  "email",
    startDate: "",
    createdAt: serverTimestamp(),
  });
  return user;
}

/* ── 이메일 로그인 ── */
export async function signIn(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

/* ── Google 로그인 — 팝업 방식 (Firebase Hosting 불필요) ── */
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(result.user, "google");
  return result.user;
}

// ★ Redirect 방식 제거 후 호환성 유지용 — 항상 null 반환
export async function handleGoogleRedirectResult(): Promise<FirebaseUser | null> {
  return null;
}

/* ── 소셜 로그인 첫 가입 시 Firestore 문서 생성 ── */
async function ensureUserDoc(
  user: FirebaseUser,
  provider: "google" | "kakao",
): Promise<void> {
  const ref  = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  // ★ 구글 계정 displayName이 20자 초과하면 자동 truncate 후 저장
  const rawName    = user.displayName ?? "";
  const name       = truncateName(rawName);

  await setDoc(ref, {
    uid:       user.uid,
    name,
    email:     user.email ?? "",
    coupleId:  null,
    role:      "user",
    provider,
    startDate: "",
    createdAt: serverTimestamp(),
  });
}

/* ── 로그아웃 ── */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/* ── Firestore 유저 조회 ── */
export async function fetchUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as AppUser;
}

// ★ v3: backfillCoupleId()는 제거됨
//   → Cloud Functions의 onCoupleJoined / onCoupleDisconnected가 대체
//   (이유: 보안 규칙상 cross-user 쓰기가 막히고, ""/null만 매칭해
//    과거 연동의 stale한 coupleId를 못 잡는 문제가 있었음 — Admin SDK로 해결)

/* ── 커플 방 생성 (초대 코드 발급) ── */
export async function createCouple(
  myUid: string,
  startDate: string,
): Promise<{ coupleId: string; inviteCode: string }> {
  const mySnap = await getDocFromServer(doc(db, "users", myUid));
  if (mySnap.exists()) {
    const existing = mySnap.data().coupleId;
    if (existing) {
      const existingCouple = await getDocFromServer(doc(db, "couples", existing));
      if (existingCouple.exists()) {
        const cd = existingCouple.data() as CoupleDoc;
        if (cd.user1Uid === myUid || cd.user2Uid === myUid) {
          throw new Error("이미 커플 연동이 되어 있어요. 먼저 연동을 해제해주세요.");
        }
      }
      await updateDoc(doc(db, "users", myUid), { coupleId: null });
    }
  }

  const chars      = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let   randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars[Math.floor(Math.random() * chars.length)];
  }
  const inviteCode = "TASTE-" + randomPart;
  const coupleId   = "couple-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  await setDoc(doc(db, "couples", coupleId), {
    id:         coupleId,
    user1Uid:   myUid,
    user2Uid:   null,
    startDate,
    inviteCode,
    createdAt:  serverTimestamp(),
  });
  await updateDoc(doc(db, "users", myUid), { coupleId });
  // ★ v3: backfillCoupleId 호출 제거 — user2Uid가 채워질 때
  //   Cloud Functions의 onCoupleJoined가 양쪽 글을 일괄 재할당함

  return { coupleId, inviteCode };
}

/* ── 초대 코드로 커플 연결 ── */
export async function joinCouple(
  inviteCode: string,
  myUid: string,
): Promise<string> {
  const mySnap = await getDocFromServer(doc(db, "users", myUid));
  if (mySnap.exists()) {
    const existing = mySnap.data().coupleId;
    if (existing) {
      const existingCouple = await getDocFromServer(doc(db, "couples", existing));
      if (existingCouple.exists()) {
        const cd = existingCouple.data() as CoupleDoc;
        if (cd.user1Uid === myUid || cd.user2Uid === myUid) {
          throw new Error("이미 커플 연동이 되어 있어요. 먼저 연동을 해제해주세요.");
        }
      }
      await updateDoc(doc(db, "users", myUid), { coupleId: null });
    }
  }

  const q    = query(
    collection(db, "couples"),
    where("inviteCode", "==", inviteCode.trim().toUpperCase()),
  );
  const snap = await getDocs(q);

  if (snap.empty)
    throw new Error("유효하지 않은 초대 코드입니다. 다시 확인해주세요.");

  const coupleDoc   = snap.docs[0];
  const coupleData  = coupleDoc.data() as CoupleDoc;
  const newCoupleId = coupleDoc.id;

  if (coupleData.user1Uid === myUid)
    throw new Error("본인이 만든 코드는 사용할 수 없습니다.");

  if (coupleData.user2Uid) {
    const u2Snap     = await getDocFromServer(doc(db, "users", coupleData.user2Uid));
    const u2CoupleId = u2Snap.exists() ? (u2Snap.data().coupleId ?? null) : null;
    if (u2CoupleId === newCoupleId) {
      throw new Error("이미 사용된 초대 코드예요. 파트너에게 새 코드를 요청해주세요.");
    }
    await updateDoc(coupleDoc.ref, { user2Uid: null });
  }

  await updateDoc(coupleDoc.ref,           { user2Uid: myUid });
  await updateDoc(doc(db, "users", myUid), { coupleId: newCoupleId });
  // ★ v3: backfillCoupleId 호출 제거 — 위에서 user2Uid가 null → myUid로
  //   바뀌는 순간 Cloud Functions의 onCoupleJoined가 트리거되어
  //   양쪽(user1Uid + myUid)의 기존 글을 newCoupleId로 일괄 재할당함
  //   (Admin SDK 사용 → cross-user 쓰기도 항상 성공, stale coupleId도 모두 잡음)

  return newCoupleId;
}

// ★ 연동 해제 결과 — users.coupleId 갱신(핵심 동작)과
//   couples 문서 삭제(뒷정리)를 분리해서 보고
//   (뒷정리 실패는 더 이상 throw로 처리하지 않음 — UI에서 재시도 배너로 안내)
export interface DisconnectResult {
  success: boolean;          // 뒷정리(couples 문서 삭제)까지 모두 성공했는지
  staleCoupleIds: string[];  // 삭제 실패해서 남아있는 couples 문서 id 목록
}

/* ── 커플 연동 해제 ── */
export async function disconnectCouple(
  myUid: string,
  coupleId: string,
): Promise<DisconnectResult> {
  const myUserSnap = await getDocFromServer(doc(db, "users", myUid));
  const myActualCoupleId: string | null = myUserSnap.exists()
    ? (myUserSnap.data().coupleId ?? null)
    : coupleId;

  const idsToTry = Array.from(new Set([myActualCoupleId, coupleId].filter(Boolean))) as string[];

  let partnerUid: string | null = null;
  const deletedCoupleIds: string[] = [];

  for (const cid of idsToTry) {
    const snap = await getDocFromServer(doc(db, "couples", cid));
    if (!snap.exists()) continue;
    const data = snap.data() as CoupleDoc;
    if (data.user1Uid === myUid || data.user2Uid === myUid) {
      const partner = data.user1Uid === myUid ? data.user2Uid : data.user1Uid;
      if (partner) partnerUid = partner;
      deletedCoupleIds.push(cid);
    }
  }

  let partnerActualCoupleId: string | null = null;
  if (partnerUid) {
    const partnerSnap = await getDocFromServer(doc(db, "users", partnerUid));
    if (partnerSnap.exists()) {
      partnerActualCoupleId = partnerSnap.data().coupleId ?? null;
      if (partnerActualCoupleId && !deletedCoupleIds.includes(partnerActualCoupleId)) {
        const partnerCoupleSnap = await getDocFromServer(doc(db, "couples", partnerActualCoupleId));
        if (partnerCoupleSnap.exists()) {
          deletedCoupleIds.push(partnerActualCoupleId);
        }
      }
    }
  }

  const userBatch = writeBatch(db);
  userBatch.update(doc(db, "users", myUid), { coupleId: null });
  if (partnerUid) {
    userBatch.update(doc(db, "users", partnerUid), { coupleId: null });
  }
  await userBatch.commit();

  const deleteResults = await Promise.allSettled(
    deletedCoupleIds.map((cid) => deleteDoc(doc(db, "couples", cid)))
  );
  // ★ v3: 위 deleteDoc()들이 트리거하는 Cloud Functions의
  //   onCoupleDisconnected가 각 coupleId로 된 visited/wishlist 글을
  //   coupleId: "" 로 자동 초기화함 — deleteDoc 자체가 실패하면
  //   이 트리거가 발생하지 않아 글의 coupleId가 그대로 남지만,
  //   useVisited()가 coupleId 없을 때 authorUid 기준 fallback 구독을 하므로
  //   화면 표시에는 지장 없음 (정리는 재시도로 마무리)

  // ★ 삭제 실패를 더 이상 조용히 삼키지 않음 — 원인 로깅 + 호출 쪽에 결과 전달
  const staleCoupleIds: string[] = [];
  deleteResults.forEach((r, i) => {
    if (r.status === "rejected") {
      staleCoupleIds.push(deletedCoupleIds[i]);
      console.error(
        `[disconnectCouple] couples/${deletedCoupleIds[i]} 삭제 실패:`,
        (r as PromiseRejectedResult).reason,
      );
    }
  });

  // users.coupleId는 이미 null로 갱신됐으므로 연동 해제 자체는 성공.
  // couples 문서 정리만 실패했다면 staleCoupleIds로 알려서 UI에서 재시도 버튼 노출
  return { success: staleCoupleIds.length === 0, staleCoupleIds };
}

/* ── 정리 안 된 couples 문서 조회 (읽기 전용 헬퍼) ──
   현재 실제로 연동 중인 코드(myCurrentCoupleId)는 절대 건드리지 않음 */
async function findOrphanCoupleIds(myUid: string): Promise<string[]> {
  const mySnap = await getDocFromServer(doc(db, "users", myUid));
  const myCurrentCoupleId: string | null = mySnap.exists()
    ? (mySnap.data().coupleId ?? null)
    : null;

  const [asUser1Snap, asUser2Snap] = await Promise.all([
    getDocs(query(collection(db, "couples"), where("user1Uid", "==", myUid))),
    getDocs(query(collection(db, "couples"), where("user2Uid", "==", myUid))),
  ]);

  return Array.from(new Set([
    ...asUser1Snap.docs.map((d) => d.id),
    ...asUser2Snap.docs.map((d) => d.id),
  ])).filter((id) => id !== myCurrentCoupleId);
}

/* ── 정리 안 된 couples 문서가 있는지 확인 (UI 배너 표시 여부 판단용) ── */
export async function hasOrphanCouples(myUid: string): Promise<boolean> {
  const ids = await findOrphanCoupleIds(myUid);
  return ids.length > 0;
}

/* ── 연동 해제 후 남은 couples 문서 정리 재시도 ── */
// disconnectCouple()의 couples 문서 삭제가 실패했을 때 다시 시도하는 용도.
// 삭제할 id를 따로 저장해두지 않고, findOrphanCoupleIds로 다시 조회해서 처리
// — 단, 지금 실제로 연동 중인 코드는 건드리지 않음.
// ★ v3: 삭제가 성공하면 Cloud Functions의 onCoupleDisconnected가
//   해당 coupleId의 visited/wishlist를 자동으로 coupleId:"" 처리함
export async function retryCleanupOrphanCouples(
  myUid: string,
): Promise<{ cleaned: number; stillFailed: string[] }> {
  const candidateIds = await findOrphanCoupleIds(myUid);
  if (candidateIds.length === 0) return { cleaned: 0, stillFailed: [] };

  const results = await Promise.allSettled(
    candidateIds.map((cid) => deleteDoc(doc(db, "couples", cid)))
  );

  const stillFailed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      stillFailed.push(candidateIds[i]);
      console.error(
        `[retryCleanupOrphanCouples] couples/${candidateIds[i]} 삭제 재시도 실패:`,
        (r as PromiseRejectedResult).reason,
      );
    }
  });

  return { cleaned: candidateIds.length - stillFailed.length, stillFailed };
}

/* ── 커플 정보 조회 ── */
export async function fetchCouple(coupleId: string): Promise<CoupleDoc | null> {
  const snap = await getDoc(doc(db, "couples", coupleId));
  if (!snap.exists()) return null;
  return snap.data() as CoupleDoc;
}

/* ── Auth 상태 변화 감지 ── */
export function initAuthListener(
  cb: (user: FirebaseUser | null) => void,
) {
  return onAuthStateChanged(auth, cb);
}
