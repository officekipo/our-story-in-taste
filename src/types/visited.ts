// 방문 기록 하나의 타입
export interface VisitedRecord {
    id: string; // Firestore 문서 ID
    coupleId: string; // 어느 커플의 기록인지
    name: string; // 식당 이름
    sido: string; // 시/도 (예: 서울)
    district: string; // 상세 지역 (예: 종로구)
    cuisine: string; // 음식 종류 (예: 한식)
    rating: 1 | 2 | 3 | 4 | 5; // 별점
    date: string; // 방문 날짜 (YYYY-MM-DD)
    memo: string; // 메모
    tags: string[]; // 선택한 태그 배열
    revisit: boolean | null; // 재방문 의향
    imgUrls: string[]; // Firebase Storage 사진 URL 배열 (최대 5장)
    emoji: string; // 사진 없을 때 폴백 이모지
    author: string; // 작성자 uid
    authorName: string; // 작성자 닉네임
    lat?: number; // 위도 (지도 핀용)
    lng?: number; // 경도
    shareToComm: boolean; // 추천 탭 공개 여부
    createdAt: string;
    updatedAt: string;
}
// 글쓰기/수정 폼에서 사용하는 타입 (id, coupleId 등 자동 생성 필드 제외)
export type VisitedFormData = Omit<
    VisitedRecord,
    'id' | 'coupleId' | 'author' | 'authorName' | 'createdAt' | 'updatedAt'
>;