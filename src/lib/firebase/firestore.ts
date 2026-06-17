// src/lib/firebase/firestore.ts
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy,
  onSnapshot, writeBatch, arrayUnion, type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import type { VisitedRecord, WishRecord, VisitEntry } from "@/types";

// ══════════════════════════════════════════════════════════
//  VISITED
// ══════════════════════════════════════════════════════════

export async function addVisited(
  data: Omit<VisitedRecord, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "visited"), {
    ...data,
    visits:    data.visits ?? [],
    createdAt: now,
    updatedAt: now,
  });
  if (data.shareToComm) {
    await addDoc(collection(db, "community"), buildCommunityPost(ref.id, data, now));
  }
  return ref.id;
}

// ★ 재방문 기록을 visits 배열에 추가 + updatedAt 갱신
export async function addVisitEntry(
  visitedId: string,
  entry: VisitEntry
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "visited", visitedId), {
    visits:    arrayUnion(entry),
    updatedAt: now,
  });
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
      // community 문서 없음 → 새로 생성
      const snap   = await getDoc(visitedRef);
      const merged = { ...(snap.data() as VisitedRecord), ...data };
      batch.set(doc(collection(db, "community")), buildCommunityPost(id, merged, now));
    } else {
      // community 문서 있음 → 필드 업데이트 + ★ isEdited: true
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
          isEdited:       true,           // ★ 수정됨 뱃지용
          ...(data.lat != null && { lat: data.lat }),
          ...(data.lng != null && { lng: data.lng }),
        })
      );
    }
  } else if (data.shareToComm === false) {
    // 공유 해제 → community 문서 삭제
    commSnap.docs.forEach((d) => batch.delete(d.ref));
  } else if (!commSnap.empty) {
    // shareToComm 변경 없이 내용만 수정 → community 문서도 동기화 + ★ isEdited: true
    commSnap.docs.forEach((d) => {
      const updateFields: Record<string, unknown> = {
        updatedAt: now,
        isEdited:  true,                  // ★ 수정됨 뱃지용
      };
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

// coupleId 기준 구독 (커플 연동 상태)
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

// ★ authorUid 기준 구독 (커플 미연동 or 연동 해제 후 본인 기록만)
export function subscribeVisitedByAuthor(
  authorUid: string,
  callback: (records: VisitedRecord[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "visited"),
    where("authorUid", "==", authorUid),
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

// ★ addedByUid 기준 구독 — 커플 연동 여부와 무관하게 "내가 추가한" 위시 항상 표시
//   Firestore 인덱스 필요: wishlist / addedByUid(asc) + createdAt(desc)
export function subscribeWishlistByAuthor(
  addedByUid: string,
  callback: (records: WishRecord[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "wishlist"),
    where("addedByUid", "==", addedByUid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WishRecord)));
  });
}

// ══════════════════════════════════════════════════════════
//  COMMUNITY
// ══════════════════════════════════════════════════════════

// ★ now 파라미터 추가 — addVisited 와 동일한 타임스탬프 사용
function buildCommunityPost(
  visitedId: string,
  data: Partial<VisitedRecord>,
  now?: string
): Record<string, unknown> {
  const ts = now ?? new Date().toISOString();
  const post: Record<string, unknown> = {
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
    isEdited:       false,           // ★ 최초 게시 시 false
    likeCount:      0,
    likedBy:        [],
    reportedBy:     [],
    createdAt:      ts,
    updatedAt:      ts,
  };
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
