// ============================================================
//  VisitedCard.tsx  적용 경로: src/components/visited/VisitedCard.tsx
//
//  Fix:
//    1. "(수정됨)" 뱃지: updatedAt이 createdAt보다 1분 이상 나중이면 표시
//    2. 이미지 없으면 height 90px (이전 수정 유지)
//    3. 글쓴이 앞 프로필 이미지 (이전 수정 유지)
//    4. memo pre-wrap (이전 수정 유지)
// ============================================================
"use client";

import { useState }       from "react";
import type { VisitedRecord } from "@/types";
import { ImageSlider }    from "@/components/common/ImageSlider";
import { StarRating }     from "@/components/common/StarRating";
import { ActionMenu }     from "@/components/common/ActionMenu";
import { useUIStore }     from "@/store/uiStore";
import { useAuthStore }   from "@/store/authStore";

const INK    = "#1A1412";
const ROSE   = "#C96B52";
const SAGE   = "#6B9E7E";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const CREAM  = "#F0EBE3";

// ★ 수정됨 판별: updatedAt이 createdAt보다 60초 이상 나중
function wasEdited(r: VisitedRecord): boolean {
  if (!r.updatedAt || !r.createdAt) return false;
  const diff = new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime();
  return diff > 60_000;
}

interface VisitedCardProps {
  record:   VisitedRecord;
  onDelete: (id: string) => void;
}

export function VisitedCard({ record, onDelete }: VisitedCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openEditModal, openDetail, openConfirm } = useUIStore();
  const { myUid, profileImgUrl, partnerProfileImgUrl } = useAuthStore();

  const area       = record.district ? `${record.sido} ${record.district}` : record.sido;
  const hasImages  = record.imgUrls.length > 0;
  const edited     = wasEdited(record);

  const authorImg   = record.authorUid === myUid ? profileImgUrl : partnerProfileImgUrl;
  const authorColor = record.authorUid === myUid ? ROSE : SAGE;

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 16, marginBottom: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", animation: "fadeUp 0.3s ease both" }}>

        {/* 상단: 이모지 + 식당명 + ⋮ */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 10px", cursor: "pointer" }} onClick={() => openDetail(record)}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {record.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{record.name}</p>
              {/* ★ 수정됨 뱃지 */}
              {edited && (
                <span style={{ fontSize: 9, color: MUTED, background: "#F0EBE3", borderRadius: 10, padding: "2px 6px", flexShrink: 0 }}>수정됨</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: MUTED }}>📍 {area} · {record.cuisine}</span>
              <span style={{ fontSize: 11, color: BORDER }}>·</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: authorColor, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {authorImg
                    ? <img src={authorImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 8, color: "#fff", fontWeight: 700 }}>{(record.authorName || "?")[0]}</span>}
                </div>
                <span style={{ fontSize: 11, color: MUTED }}>{record.authorName}</span>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#C0B8B0", padding: "4px 6px", lineHeight: 1 }}
          >⋮</button>
        </div>

        {/* 사진 슬라이더 */}
        <div onClick={() => openDetail(record)} style={{ cursor: "pointer" }}>
          <ImageSlider
            images={record.imgUrls}
            emoji={record.emoji}
            height={hasImages ? 220 : 90}
            rounded={false}
          />
        </div>

        {/* 하단: 별점 + 메모 + 태그 + 날짜 */}
        <div style={{ padding: "12px 16px 14px", cursor: "pointer" }} onClick={() => openDetail(record)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <StarRating value={record.rating} size={16} />
            <span style={{ fontSize: 18 }}>{record.revisit === true ? "❤️" : "🤍"}</span>
          </div>
          {record.memo && (
            <p style={{ fontSize: 14, color: INK, lineHeight: 1.6, marginBottom: 6, whiteSpace: "pre-wrap" }}>
              {record.memo}
            </p>
          )}
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
