export interface WishRecord {
    id: string;
    coupleId: string;
    name: string;
    sido: string;
    district: string;
    cuisine: string;
    note: string; // 가고 싶은 이유
    addedBy: string; // uid
    addedByName: string; // 닉네임
    emoji: string;
    lat?: number;
    lng?: number;
    addedDate: string; // 추가한 날짜
}
export type WishFormData = Omit<WishRecord, 'id' | 'coupleId' | 'addedBy' | 'addedByName' | 'addedDate'>;