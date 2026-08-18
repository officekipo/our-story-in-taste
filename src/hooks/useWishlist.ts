// ============================================================
//  useWishlist.ts  적용 경로: src/hooks/useWishlist.ts
//
//  Fix:
//    - remove(): imgUrls 파라미터 추가
//      → Firebase Storage URL만 필터링해서 이미지 삭제
//      → useVisited.ts 와 동일한 패턴 적용
//    - ★★ addedByUid 구독 + coupleId 구독을 동시에 켜서 합치는 방식으로 변경
//      → 내가 추가한 위시는 커플 연동/해제와 무관하게 항상 표시
//      → 커플의 위시는 연동 중일 때만 추가로 표시
//      → 두 결과는 id 기준으로 합치고 중복 제거
//      (이전: coupleId 없으면 구독 자체를 시작하지 않아 위시리스트가
//             통째로 안 보이던 문제 + 연동 해제 시 본인 위시까지 사라지던 버그 수정)
//    - ★ initialized 체크 추가 — Auth 확정 전 구독 시작 방지
// ============================================================
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";
import { db }            from "@/lib/firebase/config";
import {
  subscribeWishlist,
  subscribeWishlistByAuthor,
} from "@/lib/firebase/firestore";
import { deleteImages }  from "@/lib/firebase/storage";
import { useAuthStore }  from "@/store/authStore";
import type { WishRecord } from "@/types";

interface AddWishInput {
  name: string; sido: string; district: string;
  cuisine: string; note: string; emoji: string;
  imgUrls: string[];
  lat?: number; lng?: number;
  // ★ 커뮤니티 게시물에서 "위시 추가"로 담은 경우, 원본 community 문서 id
  fromCommunityId?: string;
}

export function useWishlist() {
  const { coupleId, myUid, myName, initialized } = useAuthStore();

  // ★ 내가 추가한 위시(addedByUid 기준) — 커플 연동 여부와 무관하게 항상 구독
  const [authorRecords, setAuthorRecords] = useState<WishRecord[]>([]);
  const [authorLoaded, setAuthorLoaded]   = useState(false);

  // ★ 커플 위시(coupleId 기준) — coupleId 있을 때만 구독
  const [coupleRecords, setCoupleRecords] = useState<WishRecord[]>([]);
  const [coupleLoaded, setCoupleLoaded]   = useState(false);

  // 내 위시 구독 (로그인 상태 + Auth 초기화 완료 시에만)
  useEffect(() => {
    // ★ Auth 초기화 완료 전에는 구독 시작하지 않음
    if (!initialized) return;

    if (!myUid) {
      setAuthorRecords([]);
      setAuthorLoaded(true);
      return;
    }

    setAuthorLoaded(false);
    const unsub = subscribeWishlistByAuthor(myUid, (data) => {
      setAuthorRecords(data);
      setAuthorLoaded(true);
    });
    return () => unsub();
  }, [initialized, myUid]);

  // 커플 위시 구독 (coupleId 있을 때만)
  useEffect(() => {
    if (!initialized) return;

    if (!coupleId) {
      setCoupleRecords([]);
      setCoupleLoaded(true);
      return;
    }

    setCoupleLoaded(false);
    const unsub = subscribeWishlist(coupleId, (data) => {
      setCoupleRecords(data);
      setCoupleLoaded(true);
    });
    return () => unsub();
  }, [initialized, coupleId]);

  // ★ 두 구독 결과를 id 기준으로 합침 (addedDate desc 기준 정렬)
  const records = useMemo(() => {
    const map = new Map<string, WishRecord>();
    coupleRecords.forEach((r) => map.set(r.id, r));
    authorRecords.forEach((r) => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => b.addedDate.localeCompare(a.addedDate));
  }, [authorRecords, coupleRecords]);

  const loading =
    !initialized ||
    !authorLoaded ||
    (!!coupleId && !coupleLoaded);

  const add = async (input: AddWishInput) => {
    if (!myUid || !myName) throw new Error("로그인 상태를 확인하세요.");
    const now = new Date().toISOString();
    const record: any = {
      coupleId: coupleId ?? "",
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
    // ★ 위시 출처 기록 — admin "가고싶어요" 탭에서 추천 여부 표시용
    if (input.fromCommunityId) record.fromCommunityId = input.fromCommunityId;
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
