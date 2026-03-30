// src/types/index.ts
// 앱 전체 타입 & 상수 — 여기서만 정의, 다른 파일은 여기서 import

export const SIDO = [
  "서울","경기","인천","부산","대구","광주","대전","울산",
  "강원","충북","충남","전북","전남","경북","경남","제주","해외",
] as const;

export const CUISINES = [
  "한식","일식","중식","이탈리안","프랑스","멕시칸","브런치",
  "카페/디저트","해산물","패스트푸드","기타",
] as const;

export const TAGS = [
  "기념일","데이트","분위기맛집","가성비","웨이팅필요",
  "로맨틱","야식","여행","첫경험","고급",
] as const;

export const SORT = [
  { v: "date",   l: "최신순" },
  { v: "rating", l: "별점순" },
  { v: "name",   l: "이름순" },
] as const;

export const REPORT_REASONS = [
  "스팸/광고성 게시물","욕설/혐오 표현","부적절한 사진",
  "허위 정보","저작권 침해","기타",
] as const;

export type SidoType    = (typeof SIDO)[number];
export type CuisineType = (typeof CUISINES)[number];
export type TagType     = (typeof TAGS)[number];

export interface VisitedRecord {
  id:          string;
  coupleId:    string;
  name:        string;
  sido:        string;
  district:    string;
  cuisine:     string;
  rating:      1 | 2 | 3 | 4 | 5;
  date:        string;
  memo:        string;
  tags:        string[];
  revisit:     boolean | null;
  imgUrls:     string[];
  emoji:       string;
  authorUid:   string;
  authorName:  string;
  lat?:        number;
  lng?:        number;
  shareToComm: boolean;
  createdAt:   string;
  updatedAt:   string;
}

export type VisitedFormData = Omit<
  VisitedRecord,
  "id" | "coupleId" | "authorUid" | "authorName" | "createdAt" | "updatedAt"
>;

export interface WishRecord {
  id:          string;
  coupleId:    string;
  name:        string;
  sido:        string;
  district:    string;
  cuisine:     string;
  note:        string;
  addedByUid:  string;
  addedByName: string;
  emoji:       string;
  lat?:        number;
  lng?:        number;
  addedDate:   string;
}

export type WishFormData = Omit<
  WishRecord,
  "id" | "coupleId" | "addedByUid" | "addedByName" | "addedDate"
>;

export interface CommunityRecord {
  id:          string;
  coupleId:    string;
  name:        string;
  sido:        string;
  district:    string;
  cuisine:     string;
  coupleLabel: string;
  memo:        string;
  tags:        string[];
  emoji:       string;
  imgUrls:     string[];
  likes:       number;
  createdAt:   string;
}

export interface AppUser {
  uid:      string;
  name:     string;
  email:    string;
  coupleId: string | null;
}

export interface CoupleDoc {
  id:         string;
  user1Uid:   string;
  user2Uid:   string | null;
  startDate:  string;
  inviteCode: string;
}
