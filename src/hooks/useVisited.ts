// ============================================================
//  useVisited.ts
//  적용 경로: src/hooks/useVisited.ts
//
//  Fix:
//    add() 에 coupleId / authorUid / authorName 자동 주입
//    → "Missing or insufficient permissions" 해결
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
      coupleId,                // ★ Firestore 보안 규칙 필수
      authorUid:  myUid,       // ★ 필수
      authorName: myName,      // ★ 필수
      name:        data.name,
      sido:        data.sido,
      district:    data.district,
      cuisine:     data.cuisine,
      rating:      data.rating,
      date:        data.date,
      memo:        data.memo   ?? "",
      tags:        data.tags   ?? [],
      revisit:     data.revisit ?? null,
      imgUrls:     imgUrls     ?? [],
      emoji:       data.emoji  ?? "🍽️",
      shareToComm: data.shareToComm ?? false,
      hideAuthor: false,
      // undefined 이면 필드 자체를 제외 (Firestore 오류 방지)
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
    // undefined 필드 제거
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
    return updateVisited(id, clean);
  };

  // ── 삭제 ─────────────────────────────────────────────────
  const remove = async (id: string, imgUrls: string[] = []) => {
    if (imgUrls.length > 0) {
      await deleteImages(imgUrls).catch(() => {}); // Storage 삭제 실패해도 계속
    }
    return deleteVisited(id);
  };

  return { records, loading, add, update, remove };
}
