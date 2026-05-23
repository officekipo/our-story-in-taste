// ============================================================
//  useVisited.ts  적용 경로: src/hooks/useVisited.ts
//
//  Fix / Add:
//    1. remove(): base64 URL 필터 (Storage URL만 삭제)
//    2. hideAuthor: data.hideAuthor ?? false
//    3. ★ addVisit(): 기존 문서에 visits 배열 원소 추가 (재방문)
//    4. ★ coupleId 없을 때 authorUid 기준 fallback 구독
//       (커플 미연동 or 연동 해제 후 본인 기록 표시)
// ============================================================
"use client";

import { useEffect, useState } from "react";
import {
  subscribeVisited,
  subscribeVisitedByAuthor,
  addVisited,
  updateVisited,
  deleteVisited,
  addVisitEntry,
} from "@/lib/firebase/firestore";
import { deleteImages } from "@/lib/firebase/storage";
import { useAuthStore } from "@/store/authStore";
import type { VisitedRecord, VisitedFormData, VisitEntry } from "@/types";

export function useVisited() {
  const { coupleId, myUid, myName } = useAuthStore();
  const [records, setRecords]       = useState<VisitedRecord[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    // ★ coupleId 있으면 커플 전체 기록, 없으면 본인 기록만
    if (coupleId) {
      const unsub = subscribeVisited(coupleId, (data) => {
        setRecords(data);
        setLoading(false);
      });
      return () => unsub();
    }

    if (myUid) {
      // 커플 미연동 or 연동 해제 후 → 본인이 작성한 기록만 표시
      const unsub = subscribeVisitedByAuthor(myUid, (data) => {
        setRecords(data);
        setLoading(false);
      });
      return () => unsub();
    }

    setLoading(false);
  }, [coupleId, myUid]);

  // ── 추가 ─────────────────────────────────────────────────
  const add = async (data: VisitedFormData, imgUrls: string[]) => {
    if (!myUid || !myName) {
      throw new Error("useVisited.add: 로그인 상태를 확인하세요.");
    }

    const record: Omit<VisitedRecord, "id" | "createdAt" | "updatedAt"> = {
      coupleId:    coupleId ?? "",   // ★ 커플 미연동 시 빈 문자열로 저장
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
      hideAuthor:  data.hideAuthor  ?? false,
      ...(data.lat != null && { lat: data.lat }),
      ...(data.lng != null && { lng: data.lng }),
      visits:      [],
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

  // ★ 재방문 기록 추가 ────────────────────────────────────
  const addVisit = async (
    recordId: string,
    entry: { date: string; rating: 1|2|3|4|5; memo: string; imgUrls: string[]; revisit: boolean | null }
  ) => {
    if (!myUid || !myName) throw new Error("useVisited.addVisit: 로그인 상태를 확인하세요.");

    const visitEntry: VisitEntry = {
      date:        entry.date,
      rating:      entry.rating,
      memo:        entry.memo,
      imgUrls:     entry.imgUrls,
      revisit:     entry.revisit,
      authorUid:   myUid,
      authorName:  myName,
      createdAt:   new Date().toISOString(),
    };

    return addVisitEntry(recordId, visitEntry);
  };

  // ── 삭제 ─────────────────────────────────────────────────
  const remove = async (id: string, imgUrls: string[] = [], visits: VisitEntry[] = []) => {
    const allUrls = [
      ...imgUrls,
      ...visits.flatMap(v => v.imgUrls ?? []),
    ];

    const storageUrls = allUrls.filter(
      (url) => url.startsWith("https://firebasestorage.googleapis.com")
    );

    if (storageUrls.length > 0) {
      await deleteImages(storageUrls).catch(() => {});
    }

    return deleteVisited(id);
  };

  return { records, loading, add, update, addVisit, remove };
}
