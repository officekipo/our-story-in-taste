export interface CommunityRecord {
    id: string;
    name: string;
    sido: string;
    district: string;
    cuisine: string;
    coupleId: string;
    coupleLabel: string; // 표시용 커플 이름 (예: 수민❤재현 커플)
    memo: string;
    tags: string[];
    emoji: string;
    imgUrls: string[];
    likes: number;
    createdAt: string;
}