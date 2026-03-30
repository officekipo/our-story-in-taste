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
    createdAt: "", updatedAt: "",
  },
  {
    id: "v2", coupleId: "sample-couple-001",
    name: "을지로 이자카야", sido: "서울", district: "을지로",
    cuisine: "일식", rating: 5, date: "2024-10-11",
    memo: "야장에서 하이볼 마시며 이런저런 얘기",
    tags: ["분위기맛집", "야식"], revisit: true,
    imgUrls: [], emoji: "🍺",
    authorUid: "uid-me", authorName: MY_NAME,
    lat: 37.566, lng: 126.991, shareToComm: false,
    createdAt: "", updatedAt: "",
  },
  {
    id: "v3", coupleId: "sample-couple-001",
    name: "르 쁘띠 파리", sido: "서울", district: "이태원",
    cuisine: "프랑스", rating: 5, date: "2024-05-01",
    memo: "100일 기념 깜짝 이벤트! 꽃다발도 받고 🌹",
    tags: ["기념일", "로맨틱"], revisit: true,
    imgUrls: [], emoji: "🥂",
    authorUid: "uid-me", authorName: MY_NAME,
    lat: 37.534, lng: 126.994, shareToComm: true,
    createdAt: "", updatedAt: "",
  },
  {
    id: "v4", coupleId: "sample-couple-001",
    name: "성수 브런치 더마켓", sido: "서울", district: "성수",
    cuisine: "브런치", rating: 3, date: "2024-09-22",
    memo: "웨이팅 2시간... 그래도 같이라서 즐거웠어",
    tags: ["브런치", "웨이팅필요"], revisit: false,
    imgUrls: [], emoji: "🥞",
    authorUid: "uid-partner", authorName: PARTNER_NAME,
    lat: 37.544, lng: 127.056, shareToComm: false,
    createdAt: "", updatedAt: "",
  },
  {
    id: "v5", coupleId: "sample-couple-001",
    name: "도쿄 라멘 신주쿠", sido: "서울", district: "강남",
    cuisine: "일식", rating: 4, date: "2024-03-20",
    memo: "비 오던 날 우산 씌워줬던 거 기억나?",
    tags: ["데이트", "야식"], revisit: true,
    imgUrls: [], emoji: "🍜",
    authorUid: "uid-partner", authorName: PARTNER_NAME,
    lat: 37.506, lng: 127.023, shareToComm: false,
    createdAt: "", updatedAt: "",
  },
  {
    id: "v6", coupleId: "sample-couple-001",
    name: "제주 흑돼지 명가", sido: "제주", district: "",
    cuisine: "한식", rating: 5, date: "2024-06-15",
    memo: "제주 여행 첫날 밤. 별 보면서 먹었던 고기",
    tags: ["여행", "로맨틱"], revisit: true,
    imgUrls: [], emoji: "🥩",
    authorUid: "uid-partner", authorName: PARTNER_NAME,
    lat: 33.489, lng: 126.498, shareToComm: true,
    createdAt: "", updatedAt: "",
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
    lat: 37.510, lng: 127.022,
  },
  {
    id: "w2", coupleId: "sample-couple-001",
    name: "부산 자갈치 회", sido: "부산", district: "",
    cuisine: "해산물", note: "부산 여행 가면 꼭",
    addedByUid: "uid-partner", addedByName: PARTNER_NAME,
    emoji: "🐟", addedDate: "2026-03-10",
    lat: 35.097, lng: 129.030,
  },
  {
    id: "w3", coupleId: "sample-couple-001",
    name: "경복궁 뷰 카페", sido: "서울", district: "종로",
    cuisine: "카페/디저트", note: "야간개장 때 꼭 같이 가자",
    addedByUid: "uid-me", addedByName: MY_NAME,
    emoji: "🏰", addedDate: "2026-02-28",
    lat: 37.579, lng: 126.977,
  },
  {
    // 청담 더 스테이크를 파트너도 추가 → "둘 다" 탭에 표시
    id: "w4", coupleId: "sample-couple-001",
    name: "청담 더 스테이크", sido: "서울", district: "강남구",
    cuisine: "스테이크", note: "기념일 때 꼭 가자!",
    addedByUid: "uid-partner", addedByName: PARTNER_NAME,
    emoji: "🥩", addedDate: "2026-03-20",
    lat: 37.510, lng: 127.022,
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
