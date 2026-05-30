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

// ★ 특정 유저의 기존 기록(visited/wishlist)에 coupleId 일괄 업데이트
async function backfillCoupleId(uid: string, coupleId: string): Promise<void> {
  const batch = writeBatch(db);
  let   count = 0;

  const visitedSnap = await getDocs(
    query(collection(db, "visited"), where("authorUid", "==", uid), where("coupleId", "==", ""))
  );
  visitedSnap.docs.forEach((d) => { batch.update(d.ref, { coupleId }); count++; });

  const wishSnap = await getDocs(
    query(collection(db, "wishlist"), where("addedByUid", "==", uid), where("coupleId", "==", ""))
  );
  wishSnap.docs.forEach((d) => { batch.update(d.ref, { coupleId }); count++; });

  if (count > 0) await batch.commit();
}

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
  await backfillCoupleId(myUid, coupleId).catch(() => {});

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

  await Promise.all([
    backfillCoupleId(myUid,               newCoupleId).catch(() => {}),
    backfillCoupleId(coupleData.user1Uid, newCoupleId).catch(() => {}),
  ]);

  return newCoupleId;
}

/* ── 커플 연동 해제 ── */
export async function disconnectCouple(
  myUid: string,
  coupleId: string,
): Promise<void> {
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

  await Promise.allSettled(
    deletedCoupleIds.map((cid) => deleteDoc(doc(db, "couples", cid)))
  );
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
