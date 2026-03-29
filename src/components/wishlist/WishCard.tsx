"use client";

import type { WishRecord } from "@/types";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils/cn";
interface WishCardProps {
  record: WishRecord;
  index: number; // 애니메이션 딜레이용
  onDelete: () => void;
}
export function WishCard({ record, index, onDelete }: WishCardProps) {
  const { name: myName } = useAuthStore();
  const { openConfirm, openEditModal } = useUIStore();
  const isMe = record.addedByName === myName;
  /* '다녀왔어요!' 클릭 → 위시 정보로 글쓰기 모달 미리 채우기 */
  const handleVisited = () => {
    /* VisitedRecord 형태로 변환해 editTarget에 임시 저장 */
    openEditModal({
      id: "", // 새 기록이므로 빈 문자열
      coupleId: record.coupleId,
      name: record.name,
      sido: record.sido,
      district: record.district,
      cuisine: record.cuisine,
      rating: 4,
      date: new Date().toISOString().slice(0, 10),
      memo: record.note,
      tags: [],
      revisit: null,
      imgUrls: [],
      emoji: record.emoji,
      author: "",
      authorName: myName,
      lat: record.lat,
      lng: record.lng,
      shareToComm: false,
      createdAt: "",
      updatedAt: "",
    });
  };
  return (
    <div
      className="bg-white rounded-card mb-4 overflow-hidden shadow-sm animatefade-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* 썸네일 영역 */}
      <div className="relative w-full h-40 bg-cream flex items-center justify-center text-5xl">
        <span>{record.emoji}</span>
        {/* 추가한 사람 배지 */}
        <div
          className={cn(
            "absolute top-2.5 right-3 rounded-full px-2.5 py-0.5",
            isMe ? "bg-rose-light" : "bg-sage-light",
          )}
        >
          <span
            className={cn(
              "text-[10px] font-bold",
              isMe ? "text-rose" : "text-sage-dark",
            )}
          >
            {record.addedByName}
          </span>
        </div>
      </div>
      {/* 정보 영역 */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-ink mb-1.5">{record.name}</h3>
        <p className="text-xs text-muted mb-1">
          {record.district ? `${record.sido} ${record.district}` : record.sido}{" "}
          · {record.cuisine}
        </p>
        <p className="text-xs text-muted mb-3"> {record.addedDate} 추가</p>
        {record.note && (
          <div className="bg-warm rounded-xl px-3.5 py-3 mb-3 text-sm textmuted leading-relaxed">
            {record.note}
          </div>
        )}
        <div className="flex items-center justify-between">
          {/* 다녀왔어요 버튼 */}
          <button
            onClick={handleVisited}
            className="px-4 py-2 bg-rose text-white text-xs font-semibold rounded-full"
          >
            다녀왔어요!
          </button>
          {/* 삭제 버튼 */}
          <button
            onClick={() =>
              openConfirm(
                record.id,
                "wish",
                `"${record.name}"을 위시리스트에서 제거할까요?`,
              )
            }
            className="flex items-center gap-1 px-3 py-1.5 border border-red-200 rounded-full text-red-500 text-xs"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
