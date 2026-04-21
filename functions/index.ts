// ============================================================
//  functions/index.ts
//
//  Firebase Cloud Functions — FCM 알림 3종
//
//  A. visited 문서 생성 시 → 파트너에게 푸시 알림
//  B. wishlist 문서 생성 시 → 파트너에게 푸시 알림
//  C. 매일 자정(KST) 기념일 계산 → 해당 커플 양쪽에 푸시 알림
//
//  배포:
//    cd functions && npm install && cd ..
//    firebase deploy --only functions
// ============================================================

import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule }        from "firebase-functions/v2/scheduler";

admin.initializeApp();

const db        = admin.firestore();
const messaging = admin.messaging();

/* ─── 기념일 마일스톤 (일수) ─────────────────────────────── */
const MILESTONES = [
  50, 100, 200, 300,
  365,                    // 1주년
  400, 500, 600, 700,
  730,                    // 2주년
  800, 900, 1000,
  1095,                   // 3주년
  1460,                   // 4주년
  1825,                   // 5주년
];

/* ─── 헬퍼: FCM 단일 발송 ────────────────────────────────── */
async function sendPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  try {
    await messaging.send({
      token,
      notification: { title, body },
      data,
      webpush: {
        notification: {
          title,
          body,
          icon:  "/icon-192.png",
          badge: "/icon-72.png",
        },
        fcmOptions: { link: "/" },
      },
    });
  } catch (err) {
    // 토큰 만료/무효 등 발송 실패는 무시
    console.warn("[FCM] 발송 실패:", err);
  }
}

/* ─── 헬퍼: 파트너 fcmToken 조회 ────────────────────────── */
async function getPartnerToken(coupleId: string, myUid: string): Promise<string | null> {
  const coupleSnap = await db.doc(`couples/${coupleId}`).get();
  if (!coupleSnap.exists) return null;

  const couple     = coupleSnap.data()!;
  const partnerUid = couple.user1Uid === myUid ? couple.user2Uid : couple.user1Uid;
  if (!partnerUid) return null;

  const partnerSnap = await db.doc(`users/${partnerUid}`).get();
  return partnerSnap.data()?.fcmToken ?? null;
}

/* ─── A. 다녀온 곳 등록 알림 ─────────────────────────────── */
export const onVisitedCreated = onDocumentCreated(
  "visited/{docId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { coupleId, authorUid, authorName, name } = data;
    if (!coupleId || !authorUid) return;

    const token = await getPartnerToken(coupleId, authorUid);
    if (!token) return;

    const displayName = authorName || "파트너";
    await sendPush(
      token,
      "새로운 맛집 기록 🍽️",
      `${displayName}이(가) "${name}"을 다녀온 곳에 추가했어요!`,
      { type: "visited", name: String(name) },
    );
  },
);

/* ─── B. 가고싶어 추가 알림 ─────────────────────────────── */
export const onWishlistCreated = onDocumentCreated(
  "wishlist/{docId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { coupleId, addedByUid, addedByName, name } = data;
    if (!coupleId || !addedByUid) return;

    const token = await getPartnerToken(coupleId, addedByUid);
    if (!token) return;

    const displayName = addedByName || "파트너";
    await sendPush(
      token,
      "위시리스트 추가 ⭐",
      `${displayName}이(가) "${name}"을 가고싶어 목록에 추가했어요!`,
      { type: "wishlist", name: String(name) },
    );
  },
);

/* ─── C. 기념일 알림 — 매일 00:00 KST ──────────────────── */
export const checkAnniversaries = onSchedule(
  { schedule: "0 0 * * *", timeZone: "Asia/Seoul" },
  async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const couplesSnap = await db.collection("couples").get();

    for (const coupleDoc of couplesSnap.docs) {
      const { user1Uid, user2Uid, startDate } = coupleDoc.data();
      if (!startDate || !user1Uid || !user2Uid) continue;

      // 경과 일수 계산
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (!MILESTONES.includes(diffDays)) continue;

      // 라벨 생성
      let label: string;
      if (diffDays % 365 === 0) {
        label = `${diffDays / 365}주년`;
      } else {
        label = `${diffDays}일`;
      }

      const title = `🎉 ${label} 기념일이에요!`;
      const body  = `함께한 지 ${label}! 오늘도 행복한 하루 보내요 💕`;

      // 커플 양쪽 모두 발송
      for (const uid of [user1Uid, user2Uid]) {
        const userSnap = await db.doc(`users/${uid}`).get();
        const token    = userSnap.data()?.fcmToken;
        if (token) {
          await sendPush(token, title, body, {
            type: "anniversary",
            days: String(diffDays),
            label,
          });
        }
      }
    }
  },
);
