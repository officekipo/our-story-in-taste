// src/lib/firebase/firestore.ts
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
          showAuthorName: data.hideAuthor === undefined ? undefined : !data.hideAuthor,
          updatedAt:      now,
          // ★ lat/lng 동기화
          ...(data.lat != null && { lat: data.lat }),
          ...(data.lng != null && { lng: data.lng }),
        })
      );
    }
  } else if (data.shareToComm === false) {
    commSnap.docs.forEach((d) => batch.delete(d.ref));
  } else if (!commSnap.empty) {
    commSnap.docs.forEach((d) => {
      const updateFields: Record<string, any> = { updatedAt: now };
      if (data.name       !== undefined) { updateFields.restaurantName = data.name; updateFields.name = data.name; }
      if (data.cuisine    !== undefined) updateFields.cuisine    = data.cuisine;
      if (data.sido       !== undefined) updateFields.sido       = data.sido;
      if (data.district   !== undefined) updateFields.district   = data.district;
      if (data.rating     !== undefined) updateFields.rating     = data.rating;
      if (data.memo       !== undefined) updateFields.memo       = data.memo;
      if (data.tags       !== undefined) updateFields.tags       = data.tags;
      if (data.imgUrls    !== undefined) updateFields.imgUrls    = data.imgUrls;
      if (data.emoji      !== undefined) updateFields.emoji      = data.emoji;
      if (data.hideAuthor !== undefined) updateFields.showAuthorName = !data.hideAuthor;
      // ★ lat/lng 동기화
      if (data.lat != null) updateFields.lat = data.lat;
      if (data.lng != null) updateFields.lng = data.lng;
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

/** ★ lat/lng 포함 — 추천탭 위시 추가 시 지도 핀 생성 지원 */
function buildCommunityPost(visitedId: string, data: Partial<VisitedRecord>): any {
  const now = new Date().toISOString();
  const post: Record<string, any> = {
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
    showAuthorName: !(data.hideAuthor ?? false),
    likeCount:      0,
    likedBy:        [],
    reportedBy:     [],
    createdAt:      now,
    updatedAt:      now,
  };
  // ★ lat/lng가 있을 때만 포함 (없으면 필드 생략)
  if (data.lat != null) post.lat = data.lat;
  if (data.lng != null) post.lng = data.lng;
  return post;
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
