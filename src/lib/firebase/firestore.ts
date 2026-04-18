// ============================================================
//  firestore.ts  적용 경로: src/lib/firebase/firestore.ts
//
//  Fix:
//    1. buildCommunityPost: showAuthorName: true 하드코딩 → !data.hideAuthor
//       (AddEditModal에서 "익명으로 공유" 선택해도 true로 덮어써지던 버그 수정)
//    2. updateVisited: community 문서 업데이트 시 showAuthorName / updatedAt 포함
//       (수정됨 표시 지원)
// ============================================================

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy,
  onSnapshot, writeBatch, type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import type { VisitedRecord, WishRecord } from "@/types";

// ══════════════════════════════════════════════════════════
//  VISITED
// ══════════════════════════════════════════════════════════

export async function addVisited(
  data: Omit<VisitedRecord, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "visited"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  if (data.shareToComm) {
    await addDoc(collection(db, "community"), buildCommunityPost(ref.id, data));
  }
  return ref.id;
}

export async function updateVisited(
  id: string,
  data: Partial<Omit<VisitedRecord, "id" | "createdAt">>
): Promise<void> {
  const now        = new Date().toISOString();
  const batch      = writeBatch(db);
  const visitedRef = doc(db, "visited", id);

  // ★ updatedAt 항상 갱신 → VisitedCard/DetailModal "수정됨" 뱃지 지원
  batch.update(visitedRef, { ...data, updatedAt: now });

  const commQ    = query(collection(db, "community"), where("visitedId", "==", id));
  const commSnap = await getDocs(commQ);

  if (data.shareToComm === true) {
    if (commSnap.empty) {
      const snap   = await getDoc(visitedRef);
      const merged = { ...(snap.data() as VisitedRecord), ...data };
      batch.set(doc(collection(db, "community")), buildCommunityPost(id, merged));
    } else {
      commSnap.docs.forEach((d) =>
        batch.update(d.ref, {
          restaurantName: data.name,
          name:           data.name,
          cuisine:        data.cuisine,
          sido:           data.sido,
          district:       data.district,
          rating:         data.rating,
          memo:           data.memo,
          tags:           data.tags,
          imgUrls:        data.imgUrls,
          emoji:          data.emoji,
          // ★ Fix: 닉네임 공개 여부도 수정 시 동기화
          showAuthorName: data.hideAuthor === undefined ? undefined : !data.hideAuthor,
          // ★ 수정됨 뱃지를 위해 updatedAt 저장
          updatedAt:      now,
        })
      );
    }
  } else if (data.shareToComm === false) {
    commSnap.docs.forEach((d) => batch.delete(d.ref));
  } else if (!commSnap.empty) {
    // shareToComm 변경 없이 내용만 수정된 경우에도 community 동기화
    commSnap.docs.forEach((d) => {
      const updateFields: Record<string, any> = { updatedAt: now };
      if (data.name      !== undefined) { updateFields.restaurantName = data.name; updateFields.name = data.name; }
      if (data.cuisine   !== undefined) updateFields.cuisine   = data.cuisine;
      if (data.sido      !== undefined) updateFields.sido      = data.sido;
      if (data.district  !== undefined) updateFields.district  = data.district;
      if (data.rating    !== undefined) updateFields.rating    = data.rating;
      if (data.memo      !== undefined) updateFields.memo      = data.memo;
      if (data.tags      !== undefined) updateFields.tags      = data.tags;
      if (data.imgUrls   !== undefined) updateFields.imgUrls   = data.imgUrls;
      if (data.emoji     !== undefined) updateFields.emoji     = data.emoji;
      if (data.hideAuthor !== undefined) updateFields.showAuthorName = !data.hideAuthor;
      batch.update(d.ref, updateFields);
    });
  }

  await batch.commit();
}

export async function deleteVisited(id: string): Promise<void> {
  const batch    = writeBatch(db);
  batch.delete(doc(db, "visited", id));
  const commSnap = await getDocs(query(collection(db, "community"), where("visitedId", "==", id)));
  commSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

// ★ createdAt desc 정렬 → 새 글이 항상 맨 위
export function subscribeVisited(
  coupleId: string,
  callback: (records: VisitedRecord[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "visited"),
    where("coupleId", "==", coupleId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as VisitedRecord)));
  });
}

// ══════════════════════════════════════════════════════════
//  WISHLIST
// ══════════════════════════════════════════════════════════

export async function addWish(data: Omit<WishRecord, "id">): Promise<string> {
  if (!data || typeof data !== "object") throw new Error("addWish: WishRecord 객체를 전달하세요.");
  if (!data.coupleId)                    throw new Error("addWish: coupleId가 없습니다.");
  const ref = await addDoc(collection(db, "wishlist"), data);
  return ref.id;
}

export async function updateWish(id: string, data: Partial<Omit<WishRecord, "id">>): Promise<void> {
  await updateDoc(doc(db, "wishlist", id), data);
}

export async function deleteWish(id: string): Promise<void> {
  await deleteDoc(doc(db, "wishlist", id));
}

export function subscribeWishlist(
  coupleId: string,
  callback: (records: WishRecord[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "wishlist"),
    where("coupleId", "==", coupleId),
    orderBy("addedDate", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WishRecord)));
  });
}

// ══════════════════════════════════════════════════════════
//  COMMUNITY
// ══════════════════════════════════════════════════════════

/** ★ Fix: showAuthorName: !data.hideAuthor (true 하드코딩 제거) */
function buildCommunityPost(visitedId: string, data: Partial<VisitedRecord>): any {
  const now = new Date().toISOString();
  return {
    coupleId:       data.coupleId    ?? "",
    visitedId,
    restaurantName: data.name        ?? "",
    name:           data.name        ?? "",
    cuisine:        data.cuisine     ?? "",
    sido:           data.sido        ?? "",
    district:       data.district    ?? "",
    rating:         data.rating      ?? 1,
    memo:           data.memo        ?? "",
    tags:           data.tags        ?? [],
    imgUrls:        data.imgUrls     ?? [],
    emoji:          data.emoji       ?? "🍽️",
    authorUid:      data.authorUid   ?? "",
    authorName:     data.authorName  ?? "",
    // ★ 닉네임 비공개 여부 반영 (hideAuthor=true → showAuthorName=false)
    showAuthorName: !(data.hideAuthor ?? false),
    likeCount:      0,
    likedBy:        [],
    reportedBy:     [],
    createdAt:      now,
    updatedAt:      now,
  };
}

// ══════════════════════════════════════════════════════════
//  USER / COUPLE
// ══════════════════════════════════════════════════════════

export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function getCoupleDoc(coupleId: string) {
  const snap = await getDoc(doc(db, "couples", coupleId));
  return snap.exists() ? { id: coupleId, ...snap.data() } : null;
}
