// src/lib/firebase/auth.ts
// 회원가입, 로그인, 로그아웃, 커플 연동 함수
// 컴포넌트에서 Firebase를 직접 import하지 않고 이 파일만 사용

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, updateDoc,
  collection, query, where, getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./config";
import type { AppUser, CoupleDoc } from "@/types";

// ── 회원가입 ──────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<FirebaseUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  // Auth 프로필 이름 설정
  await updateProfile(user, { displayName: name });

  // Firestore users 컬렉션에 문서 생성
  // 프로젝트명: Our Taste
  await setDoc(doc(db, "users", user.uid), {
    uid:       user.uid,
    name,
    email,
    coupleId:  null,
    role:      "user",
    createdAt: serverTimestamp(),
  });

  return user;
}

// ── 로그인 ────────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

// ── 로그아웃 ──────────────────────────────────────────────
export async function logOut(): Promise<void> {
  await signOut(auth);
}

// ── Firestore에서 유저 정보 불러오기 ──────────────────────
export async function fetchUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as AppUser;
}

// ── 커플 방 생성 (초대 코드 발급) ─────────────────────────
export async function createCouple(
  myUid: string,
  startDate: string,  // "YYYY-MM-DD"
): Promise<{ coupleId: string; inviteCode: string }> {
  const inviteCode = "TASTE-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const coupleId   = "couple-" + Date.now().toString(36);

  await setDoc(doc(db, "couples", coupleId), {
    id:         coupleId,
    user1Uid:   myUid,
    user2Uid:   null,
    startDate,
    inviteCode,
    createdAt:  serverTimestamp(),
  });

  // 내 유저 문서에 coupleId 저장
  await updateDoc(doc(db, "users", myUid), { coupleId });

  return { coupleId, inviteCode };
}

// ── 초대 코드 입력해서 커플 연결 ──────────────────────────
export async function joinCouple(
  inviteCode: string,
  myUid: string,
): Promise<string> {
  const q    = query(collection(db, "couples"), where("inviteCode", "==", inviteCode.trim().toUpperCase()));
  const snap = await getDocs(q);

  if (snap.empty) throw new Error("유효하지 않은 초대 코드입니다. 다시 확인해주세요.");

  const coupleDoc  = snap.docs[0];
  const coupleData = coupleDoc.data() as CoupleDoc;

  if (coupleData.user2Uid)         throw new Error("이미 연결된 커플입니다.");
  if (coupleData.user1Uid === myUid) throw new Error("본인이 만든 코드는 사용할 수 없습니다.");

  await updateDoc(coupleDoc.ref,         { user2Uid: myUid });
  await updateDoc(doc(db, "users", myUid), { coupleId: coupleDoc.id });

  return coupleDoc.id;
}

// ── 커플 정보 불러오기 ────────────────────────────────────
export async function fetchCouple(coupleId: string): Promise<CoupleDoc | null> {
  const snap = await getDoc(doc(db, "couples", coupleId));
  if (!snap.exists()) return null;
  return snap.data() as CoupleDoc;
}

// ── Auth 상태 변화 감지 리스너 ────────────────────────────
// providers.tsx 에서 한 번만 호출
export function initAuthListener(cb: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, cb);
}
