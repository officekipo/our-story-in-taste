// ============================================================
//  WishCard.tsx  적용 경로: src/components/wishlist/WishCard.tsx
//
//  Fix:
//    - openConfirm 호출 시 record.imgUrls 전달 ★
//      → uiStore confirmTarget에 imgUrls 포함 → handleDelete에서 Storage 정리 가능
// ============================================================
"use client";

import type { WishRecord, VisitedRecord } from "@/types";
import { useUIStore }   from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { todayStr }     from "@/lib/utils/date";
import { ImageSlider }  from "@/components/common/ImageSlider";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const SAGE    = "#6B9E7E";
const SAGE_DK = "#4A7A5E";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";

interface WishCardProps {
  record:     WishRecord;
  index:      number;
  onVisited?: () => void;
  onEdit?:    () => void;
}

export function WishCard({ record, index, onVisited, onEdit }: WishCardProps) {
  const { myName }                     = useAuthStore();
  const { openConfirm, openEditModal } = useUIStore();

  const isMe      = record.addedByName === myName;
  const hasImages = (record.imgUrls?.length ?? 0) > 0;

  const handleVisited = () => {
    if (onVisited) {
      onVisited();
    } else {
      const prefilled: VisitedRecord = {
        id: "", coupleId: record.coupleId,
        name: record.name, sido: record.sido, district: record.district,
        cuisine: record.cuisine, rating: 4, date: todayStr(),
        memo: record.note, tags: [], revisit: null,
        imgUrls: [], emoji: record.emoji,
        authorUid: "", authorName: myName,
        lat: record.lat, lng: record.lng,
        shareToComm: false, createdAt: "", updatedAt: "",
        hideAuthor: false,
      };
      openEditModal(prefilled);
    }
  };

  const area = record.district ? `${record.sido} ${record.district}` : record.sido;

  return (
    <div style={{ background: "#fff", borderRadius: 16, marginBottom: 14, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", animationDelay: `${index * 0.05}s` }}>

      <ImageSlider
        images={record.imgUrls ?? []}
        emoji={record.emoji}
        height={hasImages ? 160 : 90}
        rounded={false}
        lightbox={true}
      />

      <div style={{ padding: "14px 16px" }}>
        {/* 식당명 + 작성자 뱃지 */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: INK }}>{record.name}</p>
          <div style={{ flexShrink: 0, marginLeft: 8, display: "flex", alignItems: "center", gap: 4, background: isMe ? ROSE_LT : "#C8DED1", borderRadius: 20, padding: "3px 9px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: isMe ? ROSE : SAGE }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: isMe ? ROSE : SAGE_DK }}>{record.addedByName}</span>
          </div>
        </div>

        {/* 위치 · 음식 · 날짜 */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: MUTED }}>📍 {area}</span>
          <span style={{ fontSize: 12, color: BORDER }}>·</span>
          <span style={{ fontSize: 12, color: MUTED }}>{record.cuisine}</span>
          <span style={{ fontSize: 12, color: BORDER }}>·</span>
          <span style={{ fontSize: 12, color: MUTED }}>📅 {record.addedDate}</span>
        </div>

        {record.note && (
          <div style={{ background: WARM, borderRadius: 10, padding: "9px 12px", marginBottom: 12, fontSize: 13, color: MUTED, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {record.note}
          </div>
        )}

        {/* 버튼 영역 */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleVisited}
            style={{ flex: 1, padding: 10, background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            ✅ 다녀왔어요!
          </button>

          {isMe && onEdit && (
            <button
              onClick={onEdit}
              style={{ width: 44, padding: 10, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
            >
              ✏️
            </button>
          )}

          {/* ★ imgUrls 전달 추가 */}
          {isMe && (
            <button
              onClick={() =>
                openConfirm(
                  record.id,
                  "wish",
                  `"${record.name}"을 위시리스트에서 제거할까요?`,
                  record.imgUrls ?? []   // ★
                )
              }
              style={{ width: 44, padding: 10, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
