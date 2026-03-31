// src/components/wishlist/WishCard.tsx
"use client";

import type { WishRecord, VisitedRecord } from "@/types";
import { useUIStore }   from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { todayStr }     from "@/lib/utils/date";

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
  const { myName }                       = useAuthStore();
  const { openConfirm, openEditModal }   = useUIStore();
  const isMe = record.addedByName === myName;

  const handleVisited = () => {
    const prefilled: VisitedRecord = {
      id: "", coupleId: record.coupleId,
      name: record.name, sido: record.sido, district: record.district,
      cuisine: record.cuisine, rating: 4, date: todayStr(),
      memo: record.note, tags: [], revisit: null,
      imgUrls: [], emoji: record.emoji,
      authorUid: "", authorName: myName,
      lat: record.lat, lng: record.lng,
      shareToComm: false, createdAt: "", updatedAt: "",
    };
    openEditModal(prefilled);
  };

  const area = record.district ? `${record.sido} ${record.district}` : record.sido;

  return (
    <div
      style={{ background: "#fff", borderRadius: 16, marginBottom: 16, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", animation: "fadeUp 0.3s ease both", animationDelay: `${index * 0.05}s` }}
    >
      {/* 상단 헤더 행 — 이모지 + 식당명 + 작성자 칩 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 12px" }}>
        {/* 이모지 아이콘 */}
        <div style={{ width: 48, height: 48, borderRadius: 14, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
          {record.emoji}
        </div>

        {/* 식당명 + 위치·음식 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{record.name}</p>
          <p style={{ fontSize: 12, color: MUTED }}>📍 {area} · {record.cuisine}</p>
        </div>

        {/* 작성자 칩 — 우측 상단, 깔끔한 pill */}
        <div style={{ flexShrink: 0, background: isMe ? ROSE_LT : SAGE_LT, borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: isMe ? ROSE : SAGE }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: isMe ? ROSE : SAGE_DK }}>{record.addedByName}</span>
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: BORDER, margin: "0 16px" }} />

      {/* 메모 메시지 */}
      {record.note && (
        <div style={{ margin: "12px 16px 0", background: WARM, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
          💬 {record.note}
        </div>
      )}

      {/* 추가 날짜 */}
      <p style={{ fontSize: 11, color: "#C0B8B0", padding: "8px 16px 0" }}>📅 {record.addedDate} 추가</p>

      {/* 버튼 영역 */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px 14px" }}>
        <button
          onClick={handleVisited}
          style={{ flex: 1, padding: "10px", background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          ✅ 다녀왔어요!
        </button>
        <button
          onClick={() => openConfirm(record.id, "wish", `"${record.name}"을 위시리스트에서 제거할까요?`)}
          style={{ padding: "10px 16px", background: "none", border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
