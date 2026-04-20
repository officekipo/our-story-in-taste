// ============================================================
//  useWishlist.ts  적용 경로: src/hooks/useWishlist.ts
//
//  Fix:
//    - remove(): imgUrls 파라미터 추가
//      → Firebase Storage URL만 필터링해서 이미지 삭제
//      → useVisited.ts 와 동일한 패턴 적용
// ============================================================
"use client";

import { useEffect, useState } from "react";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";
import { db }            from "@/lib/firebase/config";
import { deleteImages }  from "@/lib/firebase/storage";   // ★ 추가
import { useAuthStore }  from "@/store/authStore";
import type { WishRecord } from "@/types";

interface AddWishInput {
  name: string; sido: string; district: string;
  cuisine: string; note: string; emoji: string;
  imgUrls: string[];
  lat?: number; lng?: number;
}

export function useWishlist() {
  const { coupleId, myUid, myName } = useAuthStore();
  const [records, setRecords] = useState<WishRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) { setLoading(false); return; }

    // createdAt desc → 새 글 항상 맨 위
    // Firestore 인덱스: wishlist / coupleId(asc) + createdAt(desc)
    const q = query(
      collection(db, "wishlist"),
      where("coupleId", "==", coupleId),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WishRecord)));
      setLoading(false);
    });
    return () => unsub();
  }, [coupleId]);

  const add = async (input: AddWishInput) => {
    if (!coupleId || !myUid || !myName) throw new Error("로그인/커플 연동 확인");
    const now = new Date().toISOString();
    const record: any = {
      coupleId,
      addedByUid:  myUid,
      addedByName: myName,
      addedDate:   now.slice(0, 10),
      createdAt:   now,
      name:        input.name,
      sido:        input.sido,
      district:    input.district,
      cuisine:     input.cuisine,
      note:        input.note  ?? "",
      emoji:       input.emoji ?? "🍽️",
      imgUrls:     input.imgUrls ?? [],
    };
    if (input.lat != null) record.lat = input.lat;
    if (input.lng != null) record.lng = input.lng;
    const ref = await addDoc(collection(db, "wishlist"), record);
    return ref.id;
  };

  const update = async (id: string, data: Partial<Omit<WishRecord, "id">>) => {
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await updateDoc(doc(db, "wishlist", id), clean);
  };

  // ★ Fix: imgUrls 파라미터 추가 → Storage 이미지 정리 후 문서 삭제
  const remove = async (id: string, imgUrls: string[] = []) => {
    // base64 데이터 URL 제외, Firebase Storage URL만 삭제
    const storageUrls = imgUrls.filter(
      (url) => url.startsWith("https://firebasestorage.googleapis.com")
    );

    if (storageUrls.length > 0) {
      await deleteImages(storageUrls).catch(() => {}); // 실패해도 문서 삭제는 계속
    }

    await deleteDoc(doc(db, "wishlist", id));
  };

  return { records, loading, add, update, remove };
}
