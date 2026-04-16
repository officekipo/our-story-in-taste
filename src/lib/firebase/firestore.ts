// ============================================================
//  firestore.ts  적용 경로: src/lib/firebase/firestore.ts
//
//  Fix 3: 새글이 하위로 등록되는 문제
//    - subscribeVisited 정렬을 createdAt desc 기준으로 변경
//      (date 는 유저가 과거 날짜 선택 가능 → 정렬 혼선)
//    - 필요 Firestore 복합 인덱스:
//      visited:  coupleId(asc) + createdAt(desc)
//      wishlist: coupleId(asc) + addedDate(desc)
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
  const batch      = writeBatch(db);
  const visitedRef = doc(db, "visited", id);

  batch.update(visitedRef, { ...data, updatedAt: new Date().toISOString() });

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
          restaurantName: data.name,     cuisine:  data.cuisine,
          sido:           data.sido,     district: data.district,
          rating:         data.rating,   memo:     data.memo,
          tags:           data.tags,     imgUrls:  data.imgUrls,
          emoji:          data.emoji,
        })
      );
    }
  } else if (data.shareToComm === false) {
    commSnap.docs.forEach((d) => batch.delete(d.ref));
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
    orderBy("createdAt", "desc")   // ← date → createdAt 변경
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

function buildCommunityPost(visitedId: string, data: Partial<VisitedRecord>): any {
  return {
    coupleId:       data.coupleId    ?? "",
    visitedId,
    restaurantName: data.name        ?? "",
    name:           data.name        ?? "",   // CommunityCard 호환
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
    showAuthorName: true,
    likeCount:      0,
    likedBy:        [],
    reportedBy:     [],
    createdAt:      new Date().toISOString(),
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
