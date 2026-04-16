// src/lib/sample-data.ts
// Firebase 연동(Step07) 전까지 사용하는 샘플 데이터
// authStore의 myName, partnerName 과 반드시 일치해야 함

import type { VisitedRecord, WishRecord, CommunityRecord } from "@/types";

export const MY_NAME      = "치즈";
export const PARTNER_NAME = "민준";

export const SAMPLE_VISITED: VisitedRecord[] = [
  {
    id: "v1", coupleId: "sample-couple-001",
    name: "온지음 맞춤관", sido: "서울", district: "종로",
    cuisine: "한식", rating: 5, date: "2024-02-14",
    memo: "발렌타인데이 특별 코스. 한복 입고 갔던 날 ❤️",
    tags: ["기념일", "분위기맛집"], revisit: true,
    imgUrls: [], emoji: "🏯",
    authorUid: "uid-me", authorName: MY_NAME,
    lat: 37.578, lng: 126.985, shareToComm: false,
    createdAt: "", updatedAt: "", hideAuthor: false,
  },
];

export const SAMPLE_WISHLIST: WishRecord[] = [
  {
    id: "w1", coupleId: "sample-couple-001",
    name: "청담 더 스테이크", sido: "서울", district: "강남구",
    cuisine: "스테이크",
    note: "기념일에 완벽한 곳! 분위기도 로맨틱해요 💍",
    addedByUid: "uid-me", addedByName: MY_NAME,
    emoji: "🥩", addedDate: "2026-03-19",
    lat: 37.510, lng: 127.022, imgUrls: [],
  },
];

export const SAMPLE_COMMUNITY: CommunityRecord[] = [
  {
    id: "c1", coupleId: "other-couple-1",
    name: "청담 더 스테이크", sido: "서울", district: "강남구",
    cuisine: "스테이크", coupleLabel: "수민❤재현 커플",
    memo: "기념일에 완벽한 곳! 고기가 입에서 녹아요 💍",
    tags: ["기념일추천", "분위기맛집"], emoji: "🥩", imgUrls: [],
    likes: 47, createdAt: "",
  },
  {
    id: "c2", coupleId: "other-couple-2",
    name: "한남동 파스타집", sido: "서울", district: "한남",
    cuisine: "이탈리안", coupleLabel: "민지❤준호 커플",
    memo: "창가 자리 미리 예약 필수! 분위기 진짜 최고예요",
    tags: ["데이트", "분위기맛집"], emoji: "🍝", imgUrls: [],
    likes: 128, createdAt: "",
  },
  {
    id: "c3", coupleId: "other-couple-3",
    name: "북촌 전통 찻집", sido: "서울", district: "종로",
    cuisine: "카페/디저트", coupleLabel: "서연❤태양 커플",
    memo: "한복 대여하고 가면 더 예뻐요. 포토존도 많아요",
    tags: ["데이트", "기념일"], emoji: "🍵", imgUrls: [],
    likes: 89, createdAt: "",
  },
];
