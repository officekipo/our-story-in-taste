// src/components/community/CommunityCard.tsx
"use client";

import type { CommunityRecord } from "@/types";
import { ImageSlider }          from "@/components/common/ImageSlider";
import { FlagIcon }             from "@/components/common/Icons";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const ROSE_DK = "#8C4A38";
const SAGE    = "#6B9E7E";
const SAGE_LT = "#C8DED1";
const SAGE_DK = "#4A7A5E";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";

interface CommunityCardProps {
  record:   CommunityRecord;
  isLiked:  boolean;
  isWished: boolean;
  onLike:   () => void;
  onWish:   () => void;
  onReport: () => void;
}

export function CommunityCard({ record, isLiked, isWished, onLike, onWish, onReport }: CommunityCardProps) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, marginBottom: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
      <ImageSlider images={record.imgUrls} emoji={record.emoji} height={200} rounded={false} />

      <div style={{ padding: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: INK, marginBottom: 6 }}>{record.name}</p>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>
          📍 {record.sido}{record.district ? ` ${record.district}` : ""} · {record.cuisine}
        </p>

        {/* 커플 뱃지 */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ROSE_LT, borderRadius: 20, padding: "5px 12px", marginBottom: 12 }}>
          <span style={{ fontSize: 13 }}>❤️</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: ROSE_DK }}>{record.coupleLabel}</span>
        </div>

        {record.memo && <p style={{ fontSize: 13, color: INK, lineHeight: 1.7, marginBottom: 10 }}>{record.memo}</p>}

        {record.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {record.tags.map(t => <span key={t} style={{ fontSize: 12, padding: "3px 10px", background: "#F0ECE8", color: "#8A6A5A", borderRadius: 20 }}>#{t}</span>)}
          </div>
        )}

        {/* 하단: 좋아요 + 신고 + 위시 추가 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
          <button onClick={onLike} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: isLiked ? ROSE : MUTED, fontSize: 13, fontWeight: isLiked ? 600 : 400 }}>
            <span style={{ fontSize: 16 }}>{isLiked ? "❤️" : "🤍"}</span>
            {record.likes + (isLiked ? 1 : 0)}
          </button>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={onReport} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <FlagIcon color="#C0B8B0" size={16} />
            </button>
            <button onClick={onWish} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: isWished ? SAGE_LT : SAGE, border: "none", borderRadius: 20, color: isWished ? SAGE_DK : "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
              {isWished ? "위시 완료" : "위시 추가"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
