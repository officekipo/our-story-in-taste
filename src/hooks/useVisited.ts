// src/hooks/useVisited.ts
// 방문 기록 실시간 구독 + CRUD 커스텀 훅
// page.tsx에서 useState(SAMPLE_VISITED) 대신 이 훅으로 교체

"use client";

import { useEffect, useState, useCallback } from "react";
import { subscribeVisited, addVisited, updateVisited, deleteVisited } from "@/lib/firebase/firestore";
import { deleteImages } from "@/lib/firebase/storage";
import { useAuthStore }  from "@/store/authStore";
import type { VisitedRecord, VisitedFormData } from "@/types";

export function useVisited() {
  const [records, setRecords] = useState<VisitedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // authStore에서 flat하게 꺼냄 (변수명 기준 준수)
  const { myUid, myName, coupleId } = useAuthStore();

  useEffect(() => {
    if (!coupleId) { setLoading(false); return; }
    setLoading(true);

    // 실시간 구독 시작
    const unsub = subscribeVisited(coupleId, data => {
      setRecords(data);
      setLoading(false);
    });

    // 언마운트 시 구독 해제
    return () => unsub();
  }, [coupleId]);

  // 추가
  const add = useCallback(async (data: VisitedFormData, imgUrls: string[]) => {
    if (!coupleId || !myUid) return;
    try {
      await addVisited(coupleId, myUid, myName, { ...data, imgUrls });
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, [coupleId, myUid, myName]);

  // 수정
  const update = useCallback(async (id: string, data: Partial<VisitedFormData>) => {
    try {
      await updateVisited(id, data);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  // 삭제 (Storage 이미지도 함께 삭제)
  const remove = useCallback(async (id: string, imgUrls: string[] = []) => {
    try {
      await deleteVisited(id);
      if (imgUrls.length > 0) await deleteImages(imgUrls).catch(console.warn);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  return { records, loading, error, add, update, remove };
}
