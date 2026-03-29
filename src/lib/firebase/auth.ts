import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./config";
import type { User, Couple } from "@/types";
/* ════════════════════════════
회원가입
════════════════════════════ */
export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<FirebaseUser> {
  // Firebase Auth에 계정 생성
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  // 프로필 표시 이름 설정 (Auth)
  await updateProfile(user, { displayName: name });
  // Firestore users 컬렉션에 유저 문서 생성
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name,
    email,
    coupleId: null,
    createdAt: serverTimestamp(),
  });
  return user;
}
/* ════════════════════════════
로그인
════════════════════════════ */
export async function signIn(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}
/* ════════════════════════════
로그아웃
════════════════════════════ */
export async function logOut(): Promise<void> {
  await signOut(auth);
}
/* ════════════════════════════
Firestore에서 유저 정보 불러오기
════════════════════════════ */
export async function fetchUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as User;
}
/* ════════════════════════════
커플 초대 코드 생성
(내가 먼저 커플 방을 만들고 코드를 파트너에게 전달)
════════════════════════════ */
export async function createCouple(
  myUid: string,
  dDayStart: string, // 'YYYY-MM-DD' 형식
): Promise<{ coupleId: string; inviteCode: string }> {
  // 6자리 랜덤 코드 생성 (예: TASTE-AB12CD)
  const code = "TASTE-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const coupleId = "couple-" + Date.now().toString(36);
  // Firestore couples 컬렉션에 문서 생성
  await setDoc(doc(db, "couples", coupleId), {
    id: coupleId,
    user1: myUid,
    user2: null, // 파트너가 아직 연결 안 됨
    startDate: dDayStart,
    inviteCode: code,
    createdAt: serverTimestamp(),
  });
  // 내 유저 문서에 coupleId 저장
  await updateDoc(doc(db, "users", myUid), { coupleId });
  return { coupleId, inviteCode: code };
}
/* ════════════════════════════
커플 초대 코드로 연결
(파트너가 코드를 입력해서 참여)
════════════════════════════ */
export async function joinCouple(
  inviteCode: string,
  myUid: string,
): Promise<string> {
  // inviteCode로 couples 컬렉션 검색
  const q = query(
    collection(db, "couples"),
    where("inviteCode", "==", inviteCode),
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error("유효하지 않은 초대 코드입니다. 코드를 다시 확인해주세요.");
  }
  const coupleDoc = snap.docs[0];
  const coupleData = coupleDoc.data() as Couple;
  if (coupleData.user2) {
    throw new Error("이미 연결된 커플입니다.");
  }
  if (coupleData.user1 === myUid) {
    throw new Error("본인이 만든 코드는 사용할 수 없습니다.");
  }
  // couples 문서에 user2 저장
  await updateDoc(coupleDoc.ref, { user2: myUid });
  // 내 유저 문서에 coupleId 저장
  await updateDoc(doc(db, "users", myUid), { coupleId: coupleDoc.id });
  return coupleDoc.id;
}
/* ════════════════════════════
커플 정보 불러오기
════════════════════════════ */
export async function fetchCouple(coupleId: string): Promise<Couple | null> {
  const snap = await getDoc(doc(db, "couples", coupleId));
  if (!snap.exists()) return null;
  return snap.data() as Couple;
}
/* ════════════════════════════
Auth 상태 변화 감지 리스너
providers.tsx 또는 authStore에서 한 번만 호출
════════════════════════════ */
export function initAuthListener(
  callback: (user: FirebaseUser | null) => void,
) {
  return onAuthStateChanged(auth, callback);
}
