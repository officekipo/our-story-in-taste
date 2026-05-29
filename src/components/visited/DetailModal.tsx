// ============================================================
//  DetailModal.tsx  적용 경로: src/components/visited/DetailModal.tsx
// ============================================================
"use client";

import { useState }      from "react";
import { useUIStore }    from "@/store/uiStore";
import { ImageSlider }   from "@/components/common/ImageSlider";
import { StarRating }    from "@/components/common/StarRating";
import { Modal }         from "@/components/common/Modal";
import type { VisitedRecord, VisitEntry } from "@/types";

const ROSE   = "#C96B52";
const ROSE_LT= "#F2D5CC";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const CREAM  = "#F0EBE3";
const WARM   = "#FAF7F3";

function wasEdited(r: VisitedRecord): boolean {
  if (!r.updatedAt || !r.createdAt) return false;
  return new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() > 60_000;
}

function sortedVisits(visits: VisitEntry[]): VisitEntry[] {
  return [...visits].sort((a, b) => b.date.localeCompare(a.date));
}

function VisitEntryCard({ entry, index, total }: { entry: VisitEntry; index: number; total: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div style={{ position: "relative", paddingLeft: 24, marginBottom: index < total - 1 ? 0 : 0 }}>
      {index < total - 1 && (
        <div style={{ position: "absolute", left: 7, top: 24, bottom: -12, width: 2, background: ROSE_LT }} />
      )}
      <div style={{ position: "absolute", left: 0, top: 10, width: 14, height: 14, borderRadius: "50%", background: index === 0 ? ROSE : ROSE_LT, border: `2px solid ${ROSE}`, zIndex: 1 }} />

      {/* ★ 토글 헤더에 tap 피드백 */}
      <div
        onClick={() => setOpen(o => !o)}
        className="tap"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", paddingBottom: 8 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: index === 0 ? ROSE : INK }}>{entry.date}</span>
          <StarRating value={entry.rating} size={12} />
          <span style={{ fontSize: 12 }}>{entry.revisit === true ? "❤️" : "🤍"}</span>
        </div>
        <span style={{ fontSize: 11, color: MUTED }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ marginBottom: 16 }}>
          {entry.imgUrls?.length > 0 && (
            <div style={{ marginBottom: 8, borderRadius: 10, overflow: "hidden" }}>
              <ImageSlider images={entry.imgUrls} emoji="🍽️" height={140} rounded={false} lightbox={true} />
            </div>
          )}
          {entry.memo && (
            <p style={{ fontSize: 13, color: INK, lineHeight: 1.6, whiteSpace: "pre-wrap", padding: "6px 0" }}>
              {entry.memo}
            </p>
          )}
          <p style={{ fontSize: 11, color: "#C0B8B0", marginTop: 4 }}>기록: {entry.authorName}</p>
        </div>
      )}
    </div>
  );
}

export function DetailModal() {
  const { detailRecord, closeDetail } = useUIStore();
  if (!detailRecord) return null;

  const r      = detailRecord;
  const area   = r.district ? `${r.sido} ${r.district}` : r.sido;
  const edited = wasEdited(r);

  const hasVisits   = r.visits && r.visits.length > 0;
  const totalVisits = 1 + (r.visits?.length ?? 0);
  const visits      = hasVisits ? sortedVisits(r.visits!) : [];

  const firstEntry: VisitEntry = {
    date:       r.date,
    rating:     r.rating,
    memo:       r.memo,
    imgUrls:    r.imgUrls,
    revisit:    r.revisit,
    authorUid:  r.authorUid,
    authorName: r.authorName,
    createdAt:  r.createdAt,
  };

  const timeline: VisitEntry[] = hasVisits ? [...visits, firstEntry] : [];

  // ★ bottomSheet 추가 — 하단에서 올라오며 스와이프 닫기 지원
  return (
    <Modal onClose={closeDetail} maxWidth={440} noPadding bottomSheet>
      {(() => {
        const latestImgs = hasVisits && visits[0]?.imgUrls?.length > 0
          ? visits[0].imgUrls
          : r.imgUrls;
        return (
          <ImageSlider
            images={latestImgs}
            emoji={r.emoji}
            height={latestImgs.length > 0 ? 220 : 90}
            rounded={false}
            lightbox={true}
          />
        );
      })()}

      <div style={{ padding: "18px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: INK }}>{r.name}</h2>
          {totalVisits >= 2 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: ROSE, background: ROSE_LT, borderRadius: 20, padding: "3px 10px", flexShrink: 0 }}>
              🔁 {totalVisits}번 방문
            </span>
          )}
          {edited && !hasVisits && (
            <span style={{ fontSize: 10, color: MUTED, background: CREAM, borderRadius: 10, padding: "2px 8px", flexShrink: 0 }}>수정됨</span>
          )}
        </div>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>{area} · {r.cuisine}</p>

        {hasVisits ? (
          <>
            {r.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {r.tags.map((t) => (
                  <span key={t} style={{ fontSize: 12, padding: "3px 10px", background: CREAM, color: "#8A6A5A", borderRadius: 20 }}>#{t}</span>
                ))}
              </div>
            )}
            <div style={{ background: WARM, borderRadius: 12, padding: "14px 16px", border: `1px solid ${BORDER}`, marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: MUTED, marginBottom: 14 }}>📅 방문 기록</p>
              {timeline.map((entry, i) => (
                <VisitEntryCard key={`${entry.date}-${i}`} entry={entry} index={i} total={timeline.length} />
              ))}
            </div>
          </>
        ) : (
          <>
            <StarRating value={r.rating} size={18} />
            {r.memo && (
              <p style={{ marginTop: 12, fontSize: 14, color: INK, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {r.memo}
              </p>
            )}
            {r.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {r.tags.map((t) => (
                  <span key={t} style={{ fontSize: 12, padding: "3px 10px", background: CREAM, color: "#8A6A5A", borderRadius: 20 }}>#{t}</span>
                ))}
              </div>
            )}
            <p style={{ marginTop: 10, fontSize: 14 }}>
              {r.revisit === true ? "❤️ 또 가고 싶어요" : "🤍 한 번이면 충분해요"}
            </p>
          </>
        )}

        {/* ★ 닫기 버튼에 tap 피드백 */}
        <button
          onClick={closeDetail}
          className="tap"
          style={{ width: "100%", marginTop: 4, padding: 13, background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >닫기</button>
      </div>
    </Modal>
  );
}
