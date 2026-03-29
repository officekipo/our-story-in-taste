import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
/**
 * Next.js는 개발 중 파일을 수정할 때마다 모듈을 다시 로드합니다.
 * initializeApp()을 여러 번 호출하면 오류가 납니다.
 * getApps().length 로 이미 초기화됐는지 확인 후 재사용합니다.
 */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app); // 로그인/회원가입
export const db = getFirestore(app); // 데이터베이스
export const storage = getStorage(app); // 사진 저장
