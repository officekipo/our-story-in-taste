// ============================================================
//  CommunityCard.tsx  적용 경로: src/components/community/CommunityCard.tsx
//
//  Fix:
//    1. isEdited prop → "(수정됨)" 뱃지 표시
//    2. isOwnPost → 자신 글에 신고/위시 버튼 숨김 (이전 수정 유지)
//    3. 좋아요 카운트 수정 (이전 수정 유지)
//    4. memo pre-wrap (이전 수정 유지)
// ============================================================
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
  record:    CommunityRecord;
  isLiked:   boolean;
  isWished:  boolean;
  isOwnPost: boolean;   // ★ 자신 글 여부
  isEdited:  boolean;   // ★ 수정됨 여부
  onLike:    () => void;
  onWish:    () => void;
  onReport:  () => void;
}

export function CommunityCard({ record, isLiked, isWished, isOwnPost, isEdited, onLike, onWish, onReport }: CommunityCardProps) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, marginBottom: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
      <ImageSlider images={record.imgUrls} emoji={record.emoji} height={200} rounded={false} lightbox={true} />

      <div style={{ padding: 16 }}>
        {/* 식당명 + 수정됨 뱃지 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: INK }}>{record.name}</p>
          {isEdited && (
            <span style={{ fontSize: 10, color: MUTED, background: "#F0EBE3", borderRadius: 10, padding: "2px 8px", flexShrink: 0 }}>수정됨</span>
          )}
        </div>

        <p style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>
          📍 {record.sido}{record.district ? ` ${record.district}` : ""} · {record.cuisine}
        </p>

        {/* 커플 뱃지 */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ROSE_LT, borderRadius: 20, padding: "5px 12px", marginBottom: 12 }}>
          <span style={{ fontSize: 13 }}>❤️</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: ROSE_DK }}>{record.coupleLabel}</span>
        </div>

        {record.memo && (
          <p style={{ fontSize: 13, color: INK, lineHeight: 1.7, marginBottom: 10, whiteSpace: "pre-wrap" }}>
            {record.memo}
          </p>
        )}

        {record.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {record.tags.map((t) => (
              <span key={t} style={{ fontSize: 12, padding: "3px 10px", background: "#F0ECE8", color: "#8A6A5A", borderRadius: 20 }}>#{t}</span>
            ))}
          </div>
        )}

        {/* 하단: 좋아요 + 신고 + 위시 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
          <button
            onClick={onLike}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: isLiked ? ROSE : MUTED, fontSize: 13, fontWeight: isLiked ? 600 : 400 }}
          >
            <span style={{ fontSize: 16 }}>{isLiked ? "❤️" : "🤍"}</span>
            {record.likes}
          </button>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* 자신 글에는 신고/위시 숨김 */}
            {!isOwnPost && (
              <>
                <button onClick={onReport} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <FlagIcon color="#C0B8B0" size={16} />
                </button>
                <button
                  onClick={onWish}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: isWished ? SAGE_LT : SAGE, border: "none", borderRadius: 20, color: isWished ? SAGE_DK : "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                >
                  {isWished ? "위시 완료" : "위시 추가"}
                </button>
              </>
            )}
            {isOwnPost && (
              <span style={{ fontSize: 11, color: MUTED, background: "#F5F0EB", borderRadius: 20, padding: "4px 10px" }}>내가 올린 글</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
