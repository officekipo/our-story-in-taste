// ============================================================
//  useWishlist.ts  적용 경로: src/hooks/useWishlist.ts
//
//  Fix 3: 새 글이 최상단에 오도록
//    - addedDate(날짜 문자열) 대신 createdAt(ISO timestamp) 기준 정렬
//    - subscribeWishlist 도 createdAt desc 로 변경
// ============================================================
"use client";

import { useEffect, useState } from "react";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";
import { db }          from "@/lib/firebase/config";
import { useAuthStore } from "@/store/authStore";
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

    // ★ createdAt desc → 새 글 항상 맨 위
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
      createdAt:   now,               // ★ 정렬 기준
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

  const remove = async (id: string) => {
    await deleteDoc(doc(db, "wishlist", id));
  };

  return { records, loading, add, update, remove };
}
