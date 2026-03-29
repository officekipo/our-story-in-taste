// 모든 타입을 여기서 한 번에 내보냅니다
// 다른 파일에서 import { VisitedRecord } from '@/types' 로 사용
export * from './user';
export * from './visited';
export * from './wishlist';
export * from './community';
// 앱 전체에서 공통으로 쓰는 상수도 여기에 정의
export const SIDO = [
    '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산',
    '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '해외'
] as const;
export const CUISINES = [
    '한식', '일식', '중식', '이탈리안', '프랑스', '멕시칸', '브런치',
    '카페/디저트', '해산물', '패스트푸드', '기타'
] as const;
export const TAGS = [
    '기념일', '데이트', '분위기맛집', '가성비', '웨이팅필요',
    '로맨틱', '야식', '여행', '첫경험', '고급'
] as const;

export const SORT = [
    { l: '최신순', v: 'latest' },
    { l: '평점순', v: 'rating' },
    { l: '추억순', v: 'memory' },
    { l: '거리순', v: 'distance' }
] as const;

// as const 를 붙이면 배열 안 값들이 타입으로 사용 가능해집니다
export type SidoType = typeof SIDO[number];
export type CuisineType = typeof CUISINES[number];
export type TagType = typeof TAGS[number];
export type SortType = typeof SORT[number]['v'];