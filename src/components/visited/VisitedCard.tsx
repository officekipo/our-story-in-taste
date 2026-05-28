// ============================================================
//  VisitedCard.tsx  적용 경로: src/components/visited/VisitedCard.tsx
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
const ROSE_LT= "#F2D5CC";
const SAGE   = "#6B9E7E";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const CREAM  = "#F0EBE3";

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

  const area        = record.district ? `${record.sido} ${record.district}` : record.sido;
  const edited      = wasEdited(record);

  const totalVisits = 1 + (record.visits?.length ?? 0);
  const isRevisited = totalVisits >= 2;

  const latestVisit = record.visits && record.visits.length > 0
    ? [...record.visits].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;
  const displayImgs = (latestVisit?.imgUrls?.length ? latestVisit.imgUrls : record.imgUrls);
  const hasImages   = displayImgs.length > 0;

  const authorImg   = record.authorUid === myUid ? profileImgUrl : partnerProfileImgUrl;
  const authorColor = record.authorUid === myUid ? ROSE : SAGE;

  const latestDate  = latestVisit ? latestVisit.date : record.date;

  return (
    <>
      {/* ★ 카드 전체에 tap-card 클래스 */}
      <div
        className="tap-card"
        style={{ background: "#fff", borderRadius: 16, marginBottom: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", animation: "fadeUp 0.3s ease both" }}
      >
        {/* 상단: 이모지 + 식당명 + 뱃지들 + ⋮ */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 10px", cursor: "pointer" }} onClick={() => openDetail(record)}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {record.emoji}
            </div>
            {isRevisited && (
              <div style={{ position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, background: ROSE, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                <span style={{ fontSize: 9, color: "#fff", fontWeight: 800, lineHeight: 1 }}>{totalVisits}</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{record.name}</p>
              {isRevisited && (
                <span style={{ fontSize: 10, fontWeight: 700, color: ROSE, background: ROSE_LT, borderRadius: 20, padding: "2px 7px", flexShrink: 0 }}>
                  🔁 {totalVisits}번 방문
                </span>
              )}
              {edited && !isRevisited && (
                <span style={{ fontSize: 9, color: MUTED, background: CREAM, borderRadius: 10, padding: "2px 6px", flexShrink: 0 }}>수정됨</span>
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

          {/* ★ ⋮ 버튼에 tap 클래스 */}
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }}
            className="tap"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#C0B8B0", padding: "4px 6px", lineHeight: 1 }}
          >⋮</button>
        </div>

        <div onClick={() => openDetail(record)} style={{ cursor: "pointer" }}>
          <ImageSlider
            images={displayImgs}
            emoji={record.emoji}
            height={hasImages ? 220 : 90}
            rounded={false}
          />
        </div>

        <div style={{ padding: "12px 16px 14px", cursor: "pointer" }} onClick={() => openDetail(record)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <StarRating value={latestVisit?.rating ?? record.rating} size={16} />
            <span style={{ fontSize: 18 }}>
              {(latestVisit?.revisit ?? record.revisit) === true ? "❤️" : "🤍"}
            </span>
          </div>
          {(latestVisit?.memo || record.memo) && (
            <p style={{ fontSize: 14, color: INK, lineHeight: 1.6, marginBottom: 6, whiteSpace: "pre-wrap" }}>
              {latestVisit?.memo || record.memo}
            </p>
          )}
          {record.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {record.tags.map((t) => <span key={t} style={{ fontSize: 11, color: "#8A6A5A" }}>#{t}</span>)}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{ fontSize: 11, color: "#C0B8B0" }}>
              {isRevisited ? `마지막 방문 ${latestDate}` : latestDate}
            </p>
          </div>
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
