// ============================================================
//  src/lib/firebase/admin.ts
//
//  Firebase Admin SDK — Next.js API Route 전용 (서버 사이드)
//
//  필요한 환경 변수 (.env.local + Vercel Environment Variables):
//    FIREBASE_ADMIN_PROJECT_ID
//    FIREBASE_ADMIN_CLIENT_EMAIL
//    FIREBASE_ADMIN_PRIVATE_KEY
// ============================================================

import "server-only"; // ★ 클라이언트 번들에 포함되면 즉시 빌드 에러로 차단

import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length > 0) return admin.apps[0]!;

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const adminApp = initAdmin();

export const adminAuth      = admin.auth(adminApp);
export const adminDb        = admin.firestore(adminApp);
export const adminMessaging = admin.messaging(adminApp);
