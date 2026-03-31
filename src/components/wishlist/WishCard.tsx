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
  const { myName }                     = useAuthStore();
  const { openConfirm, openEditModal } = useUIStore();
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
    <div style={{ background: "#fff", borderRadius: 16, marginBottom: 14, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", animationDelay: `${index * 0.05}s` }}>

      {/* 상단 이모지 배너 */}
      <div style={{ background: CREAM, height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>
        {record.emoji}
      </div>

      <div style={{ padding: "14px 16px" }}>

        {/* 식당명 */}
        <p style={{ fontSize: 17, fontWeight: 700, color: INK, marginBottom: 4 }}>{record.name}</p>

        {/* 위치 · 음식 · 날짜 */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: MUTED }}>📍 {area}</span>
          <span style={{ fontSize: 12, color: BORDER }}>·</span>
          <span style={{ fontSize: 12, color: MUTED }}>{record.cuisine}</span>
          <span style={{ fontSize: 12, color: BORDER }}>·</span>
          <span style={{ fontSize: 12, color: MUTED }}>📅 {record.addedDate}</span>
        </div>

        {/* 메모 */}
        {record.note && (
          <div style={{ background: WARM, borderRadius: 10, padding: "10px 12px", marginBottom: 12, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
            {record.note}
          </div>
        )}

        {/* 작성자 표시 — 카드 하단 자연스럽게 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* 아바타 원 */}
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: isMe ? ROSE : SAGE, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
              {record.addedByName[0]}
            </div>
            <span style={{ fontSize: 12, color: MUTED }}>
              <span style={{ fontWeight: 600, color: isMe ? ROSE : SAGE_DK }}>{record.addedByName}</span>
              {isMe ? "가 추가했어요" : "가 추가했어요"}
            </span>
          </div>
        </div>

        {/* 버튼 행 */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleVisited}
            style={{ flex: 1, padding: "10px 0", background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            ✅ 다녀왔어요!
          </button>
          <button
            onClick={() => openConfirm(record.id, "wish", `"${record.name}"을 위시리스트에서 제거할까요?`)}
            style={{ width: 44, padding: "10px 0", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
