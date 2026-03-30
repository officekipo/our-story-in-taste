// src/components/visited/VisitedCard.tsx
"use client";

import { useState }       from "react";
import type { VisitedRecord } from "@/types";
import { ImageSlider }    from "@/components/common/ImageSlider";
import { StarRating }     from "@/components/common/StarRating";
import { ActionMenu }     from "@/components/common/ActionMenu";
import { useUIStore }     from "@/store/uiStore";

const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const CREAM  = "#F0EBE3";

interface VisitedCardProps {
  record:   VisitedRecord;
  onDelete: (id: string) => void;
}

export function VisitedCard({ record, onDelete }: VisitedCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openEditModal, openDetail, openConfirm } = useUIStore();

  const area = record.district ? `${record.sido} ${record.district}` : record.sido;

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 16, marginBottom: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", animation: "fadeUp 0.3s ease both" }}>

        {/* 상단: 이모지 + 식당명 + 위치 + ⋮ */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 10px", cursor: "pointer" }} onClick={() => openDetail(record)}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {record.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{record.name}</p>
            <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>📍 {area} · {record.cuisine} · 👤 {record.authorName}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#C0B8B0", padding: "4px 6px", lineHeight: 1 }}
          >⋮</button>
        </div>

        {/* 사진 슬라이더 */}
        <div onClick={() => openDetail(record)} style={{ cursor: "pointer" }}>
          <ImageSlider images={record.imgUrls} emoji={record.emoji} height={220} rounded={false} />
        </div>

        {/* 하단: 별점 + 재방문 + 메모 + 태그 + 날짜 */}
        <div style={{ padding: "12px 16px 14px", cursor: "pointer" }} onClick={() => openDetail(record)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <StarRating value={record.rating} size={16} />
            <span style={{ fontSize: 18 }}>{record.revisit === true ? "❤️" : "🤍"}</span>
          </div>
          <p style={{ fontSize: 14, color: INK, lineHeight: 1.6, marginBottom: 6 }}>
            <strong>{record.name}</strong> {record.memo}
          </p>
          {record.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {record.tags.map((t) => <span key={t} style={{ fontSize: 11, color: "#8A6A5A" }}>#{t}</span>)}
            </div>
          )}
          <p style={{ fontSize: 11, color: "#C0B8B0" }}>{record.date}</p>
        </div>
      </div>

      {menuOpen && (
        <ActionMenu
          onEdit={() => { openEditModal(record); setMenuOpen(false); }}
          onDelete={() => { openConfirm(record.id, "visited", `"${record.name}" 기록을 삭제하면 복구할 수 없어요.`); setMenuOpen(false); }}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
