// ============================================================
//  useVisited.ts  적용 경로: src/hooks/useVisited.ts
//
//  Fix / Add:
//    1. remove(): base64 URL 필터 (Storage URL만 삭제)
//    2. hideAuthor: data.hideAuthor ?? false
//    3. ★ addVisit(): 기존 문서에 visits 배열 원소 추가 (재방문)
//    4. ★★ authorUid 구독 + coupleId 구독을 "동시에" 켜서 합치는 방식으로 변경
//       - 내 글(authorUid 기준)은 커플 연동/해제와 무관하게 항상 표시
//       - 커플 글(coupleId 기준)은 연동 중일 때만 추가로 표시
//       - 두 결과는 id 기준으로 합치고 중복 제거 (내 글이 양쪽에 다 걸리는 경우)
//       (이전: coupleId 있으면 커플만, 없으면 본인만 — 연동/해제 시 글이 사라지던 버그 수정)
//    5. ★ initialized 체크 추가 — Auth 확정 전 구독 시작 방지
//       (permission-denied 오류 원인 제거)
// ============================================================
"use client";

import { useEffect, useMemo, useState } from "react";
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
  const { coupleId, myUid, myName, initialized } = useAuthStore();

  // ★ 내 글(authorUid 기준) — 커플 연동 여부와 무관하게 항상 구독
  const [authorRecords, setAuthorRecords] = useState<VisitedRecord[]>([]);
  const [authorLoaded, setAuthorLoaded]   = useState(false);

  // ★ 커플 글(coupleId 기준) — coupleId 있을 때만 구독
  const [coupleRecords, setCoupleRecords] = useState<VisitedRecord[]>([]);
  const [coupleLoaded, setCoupleLoaded]   = useState(false);

  // 내 글 구독 (로그인 상태 + Auth 초기화 완료 시에만)
  useEffect(() => {
    // ★ Auth 초기화 완료 전에는 구독 시작하지 않음
    //   (초기화 전 myUid/coupleId는 초기값이라 신뢰할 수 없음)
    if (!initialized) return;

    if (!myUid) {
      setAuthorRecords([]);
      setAuthorLoaded(true);
      return;
    }

    setAuthorLoaded(false);
    const unsub = subscribeVisitedByAuthor(myUid, (data) => {
      setAuthorRecords(data);
      setAuthorLoaded(true);
    });
    return () => unsub();
  }, [initialized, myUid]);

  // 커플 글 구독 (coupleId 있을 때만)
  useEffect(() => {
    if (!initialized) return;

    if (!coupleId) {
      setCoupleRecords([]);
      setCoupleLoaded(true);
      return;
    }

    setCoupleLoaded(false);
    const unsub = subscribeVisited(coupleId, (data) => {
      setCoupleRecords(data);
      setCoupleLoaded(true);
    });
    return () => unsub();
  }, [initialized, coupleId]);

  // ★ 두 구독 결과를 id 기준으로 합침 (내 글이 커플 글에도 포함되는 경우 중복 제거)
  const records = useMemo(() => {
    const map = new Map<string, VisitedRecord>();
    coupleRecords.forEach((r) => map.set(r.id, r));
    authorRecords.forEach((r) => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [authorRecords, coupleRecords]);

  const loading =
    !initialized ||
    !authorLoaded ||
    (!!coupleId && !coupleLoaded);

  // ── 추가 ─────────────────────────────────────────────────
  const add = async (data: VisitedFormData, imgUrls: string[]) => {
    if (!myUid || !myName) {
      throw new Error("useVisited.add: 로그인 상태를 확인하세요.");
    }

    const record: Omit<VisitedRecord, "id" | "createdAt" | "updatedAt"> = {
      coupleId:    coupleId ?? "",
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
