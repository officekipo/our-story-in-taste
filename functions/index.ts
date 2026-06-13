// ============================================================
//  functions/index.ts  v2
//
//  변경사항:
//    ★ sendPush() — expireAt 필드 추가 (Firestore TTL 자동 삭제용, 90일)
//    ★ cleanupNotifications — 매일 01:00 KST 스케줄러
//                             createdAt 90일 초과 문서 500개씩 일괄 삭제
//
//  notifications 컬렉션 구조:
//    uid:       string
//    type:      "visited" | "wishlist" | "anniversary"
//    title:     string
//    body:      string
//    read:      boolean
//    data?:     Record<string, string>
//    createdAt: string         ISO string
//    expireAt:  Timestamp      ★ TTL 정책용 — 90일 후 Firestore 자동 삭제
//
//  Firestore TTL 정책 설정 (한 번만):
//    Firebase Console → Firestore → TTL 정책 탭
//    → 컬렉션: notifications / 필드: expireAt → 저장
//    (TTL + 스케줄러 이중 적용 → 누락 없음)
//
//  announcements 컬렉션 구조 (admin 페이지에서 관리):
//    title, body, type, pinned, visible, startAt?, endAt?, imgUrls[], createdAt
// ============================================================

import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule }        from "firebase-functions/v2/scheduler";

admin.initializeApp();

const db        = admin.firestore();
const messaging = admin.messaging();

/* ─── 상수 ───────────────────────────────────────────────── */
const RETENTION_DAYS = 90;                                      // 알림 보관 기간
const MS_PER_DAY     = 1000 * 60 * 60 * 24;
const BATCH_SIZE     = 500;                                     // Firestore 배치 최대

const MILESTONES = [
  50, 100, 200, 300,
  365,
  400, 500, 600, 700,
  730,
  800, 900, 1000,
  1095, 1460, 1825,
];

/* ─── 헬퍼: FCM 발송 + notifications 저장 ───────────────────
 *  ★ expireAt 추가 — Firestore TTL 정책이 자동 삭제에 사용
 * ─────────────────────────────────────────────────────────── */
async function sendPush(
  token:        string,
  recipientUid: string,
  title:        string,
  body:         string,
  data?:        Record<string, string>,
) {
  /* 1. FCM 발송 (data-only) */
  try {
    await messaging.send({
      token,
      data: { title, body, icon: "/icon-192.png", ...data },
      webpush: { fcmOptions: { link: "/" } },
    });
  } catch (err) {
    console.warn("[FCM] 발송 실패:", err);
  }

  /* 2. notifications 저장 */
  try {
    const now      = new Date();
    const expireAt = new Date(now.getTime() + RETENTION_DAYS * MS_PER_DAY);

    await db.collection("notifications").add({
      uid:       recipientUid,
      type:      data?.type ?? "visited",
      title,
      body,
      read:      false,
      data:      data ?? {},
      createdAt: now.toISOString(),
      expireAt:  admin.firestore.Timestamp.fromDate(expireAt), // ★ TTL용
    });
  } catch (err) {
    console.warn("[Notifications] 저장 실패:", err);
  }
}

/* ─── 헬퍼: 파트너 uid + fcmToken 조회 ──────────────────── */
async function getPartnerInfo(
  coupleId: string,
  myUid:    string,
): Promise<{ uid: string; token: string } | null> {
  const coupleSnap = await db.doc(`couples/${coupleId}`).get();
  if (!coupleSnap.exists) return null;

  const couple     = coupleSnap.data()!;
  const partnerUid = couple.user1Uid === myUid ? couple.user2Uid : couple.user1Uid;
  if (!partnerUid) return null;

  const partnerSnap = await db.doc(`users/${partnerUid}`).get();
  const token       = partnerSnap.data()?.fcmToken;
  if (!token) return null;

  return { uid: partnerUid, token };
}

/* ─── A. 다녀온 곳 등록 알림 ─────────────────────────────── */
export const onVisitedCreated = onDocumentCreated(
  "visited/{docId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const { coupleId, authorUid, authorName, name } = data;
    if (!coupleId || !authorUid) return;
    const partner = await getPartnerInfo(coupleId, authorUid);
    if (!partner) return;
    await sendPush(
      partner.token, partner.uid,
      "새로운 맛지도 기록 🍽️",
      `${authorName || "파트너"}이(가) "${name}"을 다녀온 곳에 추가했어요!`,
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
    const partner = await getPartnerInfo(coupleId, addedByUid);
    if (!partner) return;
    await sendPush(
      partner.token, partner.uid,
      "위시리스트 추가 ⭐",
      `${addedByName || "파트너"}이(가) "${name}"을 가고싶어 목록에 추가했어요!`,
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

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (today.getTime() - start.getTime()) / MS_PER_DAY,
      );
      if (!MILESTONES.includes(diffDays)) continue;

      const label = diffDays % 365 === 0 ? `${diffDays / 365}주년` : `${diffDays}일`;
      const title = `🎉 ${label} 기념일이에요!`;
      const body  = `함께한 지 ${label}! 오늘도 행복한 하루 보내요 💕`;

      for (const uid of [user1Uid, user2Uid]) {
        const userSnap = await db.doc(`users/${uid}`).get();
        const token    = userSnap.data()?.fcmToken;
        if (token) await sendPush(token, uid, title, body, { type: "anniversary", days: String(diffDays), label });
      }
    }
  },
);

/* ─── D. 알림 정리 스케줄러 — 매일 01:00 KST ★ 신규 ────────
 *  TTL 정책의 보완재:
 *    Firestore TTL은 보통 24~72시간 내 삭제하지만 보장 없음
 *    → 스케줄러로 90일 초과 문서를 확실하게 제거
 *
 *  처리 방식:
 *    createdAt < (오늘 - 90일) 인 문서 조회 → 500개씩 배치 삭제
 *    한 번에 최대 2,000개 삭제 (4배치) — 대용량 시 다음 날 이어서 처리
 * ─────────────────────────────────────────────────────────── */
export const cleanupNotifications = onSchedule(
  { schedule: "0 1 * * *", timeZone: "Asia/Seoul" },
  async () => {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * MS_PER_DAY);
    const cutoffIso = cutoff.toISOString();

    console.log(`[Cleanup] ${cutoffIso} 이전 알림 삭제 시작`);

    let totalDeleted = 0;
    const MAX_BATCHES = 4; // 1회 실행당 최대 2,000개

    for (let i = 0; i < MAX_BATCHES; i++) {
      const snap = await db
        .collection("notifications")
        .where("createdAt", "<", cutoffIso)
        .limit(BATCH_SIZE)
        .get();

      if (snap.empty) break;

      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      totalDeleted += snap.docs.length;
      console.log(`[Cleanup] 배치 ${i + 1}: ${snap.docs.length}건 삭제`);

      if (snap.docs.length < BATCH_SIZE) break; // 마지막 배치
    }

    console.log(`[Cleanup] 완료 — 총 ${totalDeleted}건 삭제`);
  },
);
