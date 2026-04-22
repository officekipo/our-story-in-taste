// src/lib/firebase/auth.ts
// 이메일·Google 로그인, 커플 연동 함수

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
  doc, setDoc, getDoc, updateDoc,
  collection, query, where, getDocs,
  serverTimestamp, deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./config";
import type { AppUser, CoupleDoc } from "@/types";

/* ── 이메일 회원가입 ── */
export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<FirebaseUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: name });
  await setDoc(doc(db, "users", user.uid), {
    uid:      user.uid,
    name,
    email,
    coupleId: null,
    role:     "user",
    provider: "email",
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

/* ── Google 로그인 ── */
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(result.user, "google");
  return result.user;
}

/* 소셜 로그인 첫 가입 시 Firestore 문서 생성 */
async function ensureUserDoc(
  user: FirebaseUser,
  provider: "google" | "kakao",
): Promise<void> {
  const ref  = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    uid:       user.uid,
    name:      user.displayName ?? "이름없음",
    email:     user.email ?? "",
    coupleId:  null,
    role:      "user",
    provider,
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

/* ── 커플 방 생성 (초대 코드 발급) ── */
export async function createCouple(
  myUid: string,
  startDate: string,
): Promise<{ coupleId: string; inviteCode: string }> {

  // ★ 이미 커플 연동된 유저 방지
  const mySnap = await getDoc(doc(db, "users", myUid));
  if (mySnap.exists()) {
    const existing = mySnap.data().coupleId;
    if (existing) {
      // 기존 couple 문서가 실제로 존재하는지 확인 (고아 데이터 방지)
      const existingCouple = await getDoc(doc(db, "couples", existing));
      if (existingCouple.exists()) {
        throw new Error("이미 커플 연동이 되어 있어요. 먼저 연동을 해제해주세요.");
      }
      // 고아 coupleId 정리
      await updateDoc(doc(db, "users", myUid), { coupleId: null });
    }
  }

  // TASTE- + 6자리 대문자 영숫자
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
  return { coupleId, inviteCode };
}

/* ── 초대 코드로 커플 연결 ── */
export async function joinCouple(
  inviteCode: string,
  myUid: string,
): Promise<string> {

  // ★ 조인하는 유저가 이미 커플인지 확인
  const mySnap = await getDoc(doc(db, "users", myUid));
  if (mySnap.exists()) {
    const existing = mySnap.data().coupleId;
    if (existing) {
      const existingCouple = await getDoc(doc(db, "couples", existing));
      if (existingCouple.exists()) {
        throw new Error("이미 커플 연동이 되어 있어요. 먼저 연동을 해제해주세요.");
      }
      // 고아 coupleId 정리
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

  const coupleDoc  = snap.docs[0];
  const coupleData = coupleDoc.data() as CoupleDoc;

  // ★ 이미 2명이 연동된 코드 (중복 사용 방지)
  if (coupleData.user2Uid)
    throw new Error("이미 사용된 초대 코드예요. 파트너에게 새 코드를 요청해주세요.");

  // ★ 본인 코드 사용 방지
  if (coupleData.user1Uid === myUid)
    throw new Error("본인이 만든 코드는 사용할 수 없습니다.");

  await updateDoc(coupleDoc.ref,           { user2Uid: myUid });
  await updateDoc(doc(db, "users", myUid), { coupleId: coupleDoc.id });
  return coupleDoc.id;
}

/* ── ★ 커플 연동 해제 ── */
export async function disconnectCouple(
  myUid: string,
  coupleId: string,
): Promise<void> {
  const coupleSnap = await getDoc(doc(db, "couples", coupleId));
  if (!coupleSnap.exists()) {
    // couple 문서가 없어도 유저 coupleId는 초기화
    await updateDoc(doc(db, "users", myUid), { coupleId: null });
    return;
  }

  const coupleData = coupleSnap.data() as CoupleDoc;
  const partnerUid = coupleData.user1Uid === myUid
    ? coupleData.user2Uid
    : coupleData.user1Uid;

  // 양쪽 유저 coupleId 초기화
  await updateDoc(doc(db, "users", myUid), { coupleId: null });
  if (partnerUid) {
    await updateDoc(doc(db, "users", partnerUid), { coupleId: null });
  }

  // couple 문서 삭제
  await deleteDoc(doc(db, "couples", coupleId));
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
