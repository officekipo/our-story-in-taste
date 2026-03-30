// src/components/wishlist/WishCard.tsx
"use client";

import type { WishRecord } from "@/types";
import { useUIStore }      from "@/store/uiStore";
import { useAuthStore }    from "@/store/authStore";
import type { VisitedRecord } from "@/types";
import { todayStr }        from "@/lib/utils/date";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const SAGE    = "#6B9E7E";
const SAGE_LT = "#C8DED1";
const SAGE_DK = "#4A7A5E";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const CREAM   = "#F0EBE3";

interface WishCardProps {
  record: WishRecord;
  index:  number;
}

export function WishCard({ record, index }: WishCardProps) {
  const { myName }                    = useAuthStore();
  const { openConfirm, openEditModal } = useUIStore();
  const isMe = record.addedByName === myName;

  // "다녀왔어요!" → 위시 정보로 AddEditModal 미리 채워서 열기
  const handleVisited = () => {
    const prefilled: VisitedRecord = {
      id:          "",
      coupleId:    record.coupleId,
      name:        record.name,
      sido:        record.sido,
      district:    record.district,
      cuisine:     record.cuisine,
      rating:      4,
      date:        todayStr(),
      memo:        record.note,
      tags:        [],
      revisit:     null,
      imgUrls:     [],
      emoji:       record.emoji,
      authorUid:   "",
      authorName:  myName,
      lat:         record.lat,
      lng:         record.lng,
      shareToComm: false,
      createdAt:   "",
      updatedAt:   "",
    };
    openEditModal(prefilled);
  };

  const area = record.district ? `${record.sido} ${record.district}` : record.sido;

  return (
    <div style={{ background: "#fff", borderRadius: 16, marginBottom: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", animationDelay: `${index * 0.05}s` }}>

      {/* 썸네일 */}
      <div style={{ position: "relative", width: "100%", height: 160, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>
        <span>{record.emoji}</span>
        {/* 추가한 사람 배지 */}
        <div style={{ position: "absolute", top: 10, right: 12, background: isMe ? ROSE_LT : SAGE_LT, borderRadius: 20, padding: "3px 10px" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: isMe ? ROSE : SAGE_DK }}>👤 {record.addedByName}</span>
        </div>
      </div>

      {/* 정보 */}
      <div style={{ padding: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: INK, marginBottom: 6 }}>{record.name}</p>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>📍 {area} · {record.cuisine}</p>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>📅 {record.addedDate} 추가</p>

        {record.note && (
          <div style={{ background: WARM, borderRadius: 10, padding: "12px 14px", marginBottom: 12, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
            {record.note}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={handleVisited} style={{ padding: "8px 18px", background: ROSE, border: "none", borderRadius: 20, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            ✅ 다녀왔어요!
          </button>
          <button onClick={() => openConfirm(record.id, "wish", `"${record.name}"을 위시리스트에서 제거할까요?`)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "none", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 20, color: "#EF4444", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            🗑️ 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
