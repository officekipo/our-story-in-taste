// src/lib/firebase/firestore.ts
// Firestore CRUD 함수 — 컴포넌트/훅에서 이 파일만 import

import {
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy,
  onSnapshot, serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import type { VisitedRecord, VisitedFormData, WishRecord, WishFormData } from "@/types";

// ── 방문 기록 실시간 구독 ─────────────────────────────────
export function subscribeVisited(
  coupleId: string,
  callback: (records: VisitedRecord[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "visited"),
    where("coupleId", "==", coupleId),
    orderBy("date", "desc"),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as VisitedRecord[]);
  });
}

// ── 방문 기록 추가 ────────────────────────────────────────
export async function addVisited(
  coupleId:   string,
  authorUid:  string,
  authorName: string,
  data:       VisitedFormData,
): Promise<string> {
  const ref = await addDoc(collection(db, "visited"), {
    ...data,
    coupleId,
    authorUid,
    authorName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ── 방문 기록 수정 ────────────────────────────────────────
export async function updateVisited(
  id:   string,
  data: Partial<VisitedFormData>,
): Promise<void> {
  await updateDoc(doc(db, "visited", id), { ...data, updatedAt: serverTimestamp() });
}

// ── 방문 기록 삭제 ────────────────────────────────────────
export async function deleteVisited(id: string): Promise<void> {
  await deleteDoc(doc(db, "visited", id));
}

// ── 위시리스트 실시간 구독 ───────────────────────────────
export function subscribeWishlist(
  coupleId: string,
  callback: (records: WishRecord[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "wishlist"),
    where("coupleId", "==", coupleId),
    orderBy("addedDate", "desc"),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as WishRecord[]);
  });
}

// ── 위시리스트 추가 ───────────────────────────────────────
export async function addWish(
  coupleId:    string,
  addedByUid:  string,
  addedByName: string,
  data:        WishFormData,
): Promise<void> {
  await addDoc(collection(db, "wishlist"), {
    ...data,
    coupleId,
    addedByUid,
    addedByName,
    addedDate: new Date().toISOString().slice(0, 10),
  });
}

// ── 위시리스트 삭제 ───────────────────────────────────────
export async function deleteWish(id: string): Promise<void> {
  await deleteDoc(doc(db, "wishlist", id));
}
