// src/hooks/useWishlist.ts
// 위시리스트 실시간 구독 + CRUD 커스텀 훅

"use client";

import { useEffect, useState, useCallback } from "react";
import { subscribeWishlist, addWish, deleteWish } from "@/lib/firebase/firestore";
import { useAuthStore } from "@/store/authStore";
import type { WishRecord, WishFormData } from "@/types";

export function useWishlist() {
  const [records, setRecords] = useState<WishRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const { myUid, myName, coupleId } = useAuthStore();

  useEffect(() => {
    if (!coupleId) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeWishlist(coupleId, data => {
      setRecords(data);
      setLoading(false);
    });
    return () => unsub();
  }, [coupleId]);

  const add = useCallback(async (data: WishFormData) => {
    if (!coupleId || !myUid) return;
    await addWish(coupleId, myUid, myName, data);
  }, [coupleId, myUid, myName]);

  const remove = useCallback(async (id: string) => {
    await deleteWish(id);
  }, []);

  return { records, loading, add, remove };
}
