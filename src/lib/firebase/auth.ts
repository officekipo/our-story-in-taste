// src/lib/firebase/auth.ts
// 회원가입, 로그인, 소셜 로그인, 로그아웃, 커플 연동 함수
// 컴포넌트에서 Firebase를 직접 import하지 않고 이 파일의 함수만 사용합니다.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, updateDoc,
  collection, query, where, getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./config";
import type { AppUser, CoupleDoc } from "@/types";

/* ════════════════════════════════
   이메일 회원가입
════════════════════════════════ */
export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<FirebaseUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: name });

  // Firestore users 문서 생성 (Firebase 프로젝트명: Our Taste)
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

/* ════════════════════════════════
   이메일 로그인
════════════════════════════════ */
export async function signIn(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

/* ════════════════════════════════
   Google 소셜 로그인
   모바일: Redirect 방식 (앱처럼 동작)
   데스크톱: Popup 방식
════════════════════════════════ */
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  if (isMobile) {
    // 모바일: 리디렉션 (페이지 이동 후 getGoogleRedirectResult로 결과 처리)
    await signInWithRedirect(auth, googleProvider);
    return null; // 리디렉션 후 결과는 getGoogleRedirectResult에서 처리
  } else {
    // 데스크톱: 팝업
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(result.user, "google");
    return result.user;
  }
}

/* ════════════════════════════════
   Google 리디렉션 결과 처리
   모바일에서 Google 로그인 후 돌아왔을 때 호출
   login/page.tsx의 useEffect에서 호출하세요.
════════════════════════════════ */
export async function getGoogleRedirectResult(): Promise<FirebaseUser | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    await ensureUserDoc(result.user, "google");
    return result.user;
  } catch {
    return null;
  }
}

/* ════════════════════════════════
   소셜 로그인 유저 — Firestore 문서가 없으면 생성
   (처음 가입하는 경우에만 생성)
════════════════════════════════ */
async function ensureUserDoc(
  user: FirebaseUser,
  provider: "google" | "kakao",
): Promise<void> {
  const ref  = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return; // 이미 있으면 스킵

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

/* ════════════════════════════════
   로그아웃
════════════════════════════════ */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/* ════════════════════════════════
   Firestore 유저 정보 조회
════════════════════════════════ */
export async function fetchUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as AppUser;
}

/* ════════════════════════════════
   커플 방 생성 (초대 코드 발급)
════════════════════════════════ */
export async function createCouple(
  myUid: string,
  startDate: string,
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

  await updateDoc(doc(db, "users", myUid), { coupleId });
  return { coupleId, inviteCode };
}

/* ════════════════════════════════
   초대 코드로 커플 연결
════════════════════════════════ */
export async function joinCouple(
  inviteCode: string,
  myUid: string,
): Promise<string> {
  const q    = query(
    collection(db, "couples"),
    where("inviteCode", "==", inviteCode.trim().toUpperCase()),
  );
  const snap = await getDocs(q);

  if (snap.empty)
    throw new Error("유효하지 않은 초대 코드입니다. 다시 확인해주세요.");

  const coupleDoc  = snap.docs[0];
  const coupleData = coupleDoc.data() as CoupleDoc;

  if (coupleData.user2Uid)
    throw new Error("이미 연결된 커플입니다.");
  if (coupleData.user1Uid === myUid)
    throw new Error("본인이 만든 코드는 사용할 수 없습니다.");

  await updateDoc(coupleDoc.ref,            { user2Uid: myUid });
  await updateDoc(doc(db, "users", myUid),  { coupleId: coupleDoc.id });
  return coupleDoc.id;
}

/* ════════════════════════════════
   커플 정보 조회
════════════════════════════════ */
export async function fetchCouple(coupleId: string): Promise<CoupleDoc | null> {
  const snap = await getDoc(doc(db, "couples", coupleId));
  if (!snap.exists()) return null;
  return snap.data() as CoupleDoc;
}

/* ════════════════════════════════
   Auth 상태 변화 감지 리스너
   authStore.ts의 setupAuthListener에서 사용
════════════════════════════════ */
export function initAuthListener(
  cb: (user: FirebaseUser | null) => void,
) {
  return onAuthStateChanged(auth, cb);
}
