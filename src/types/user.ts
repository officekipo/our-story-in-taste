// 유저 정보
export interface User {
    uid: string; // Firebase Auth UID
    name: string; // 닉네임 (예: 치즈)
    email: string;
    avatarUrl?: string; // 프로필 사진 URL (없으면 이니셜)
    coupleId?: string; // 연결된 커플 ID
    createdAt: string; // ISO 8601 날짜 문자열
}
// 커플 정보
export interface Couple {
    id: string; // 커플 고유 ID
    user1: string; // uid
    user2: string; // uid
    startDate: string; // 교제 시작일 (D-Day 기준)
    inviteCode: string; // 초대 코드 (예: TASTE-1234)
}