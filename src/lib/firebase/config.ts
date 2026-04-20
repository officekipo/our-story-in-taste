// src/lib/firebase/config.ts
// Firebase 앱 초기화 — 다른 파일에서 auth, db, storage 만 import해서 사용

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth }      from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage }   from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging"; // ★ 추가

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Next.js 핫리로드 시 중복 초기화 방지
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth    = getAuth(app);       // 로그인/회원가입
export const db      = getFirestore(app);  // Firestore DB
export const storage = getStorage(app);    // Storage (사진)

// ★ Messaging: 브라우저 환경 + ServiceWorker 지원 시에만 초기화
//   SSR(서버)에서는 호출하지 않도록 async 함수로 노출
export const getFirebaseMessaging = async () => {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
};
