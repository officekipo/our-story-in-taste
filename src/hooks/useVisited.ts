// ============================================================
//  useVisited.ts  적용 경로: src/hooks/useVisited.ts
//
//  Fix:
//    1. remove(): base64 URL을 Firebase Storage DELETE 호출하는 오류 수정
//       → https://firebasestorage.googleapis.com 로 시작하는 URL만 삭제
//    2. hideAuthor: data.hideAuthor ?? false (이전 수정 유지)
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { subscribeVisited, addVisited, updateVisited, deleteVisited } from "@/lib/firebase/firestore";
import { deleteImages } from "@/lib/firebase/storage";
import { useAuthStore } from "@/store/authStore";
import type { VisitedRecord, VisitedFormData } from "@/types";

export function useVisited() {
  const { coupleId, myUid, myName } = useAuthStore();
  const [records, setRecords]       = useState<VisitedRecord[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!coupleId) { setLoading(false); return; }

    const unsub = subscribeVisited(coupleId, (data) => {
      setRecords(data);
      setLoading(false);
    });

    return () => unsub();
  }, [coupleId]);

  // ── 추가 ─────────────────────────────────────────────────
  const add = async (data: VisitedFormData, imgUrls: string[]) => {
    if (!coupleId || !myUid || !myName) {
      throw new Error("useVisited.add: 로그인/커플 연동 상태를 확인하세요.");
    }

    const record: Omit<VisitedRecord, "id" | "createdAt" | "updatedAt"> = {
      coupleId,
      authorUid:   myUid,
      authorName:  myName,
      name:        data.name,
      sido:        data.sido,
      district:    data.district,
      cuisine:     data.cuisine,
      rating:      data.rating,
      date:        data.date,
      memo:        data.memo        ?? "",
      tags:        data.tags        ?? [],
      revisit:     data.revisit     ?? null,
      imgUrls:     imgUrls          ?? [],
      emoji:       data.emoji       ?? "🍽️",
      shareToComm: data.shareToComm ?? false,
      hideAuthor:  data.hideAuthor  ?? false,   // ★ 폼 값 반영
      ...(data.lat != null && { lat: data.lat }),
      ...(data.lng != null && { lng: data.lng }),
    };

    return addVisited(record);
  };

  // ── 수정 ─────────────────────────────────────────────────
  const update = async (
    id: string,
    data: Partial<Omit<VisitedRecord, "id" | "createdAt">>
  ) => {
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
    return updateVisited(id, clean);
  };

  // ── 삭제 ─────────────────────────────────────────────────
  const remove = async (id: string, imgUrls: string[] = []) => {
    // ★ Fix: base64 데이터 URL은 Firebase Storage에 없으므로 제외
    //   base64는 'data:' 로 시작 / Firebase Storage URL은 'https://firebasestorage.googleapis.com' 으로 시작
    const storageUrls = imgUrls.filter(
      (url) => url.startsWith("https://firebasestorage.googleapis.com")
    );

    if (storageUrls.length > 0) {
      await deleteImages(storageUrls).catch(() => {}); // 실패해도 문서 삭제는 계속
    }

    return deleteVisited(id);
  };

  return { records, loading, add, update, remove };
}
