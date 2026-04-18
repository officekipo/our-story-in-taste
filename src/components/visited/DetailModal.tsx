// ============================================================
//  DetailModal.tsx  적용 경로: src/components/visited/DetailModal.tsx
//
//  Fix:
//    1. "(수정됨)" 표시 — updatedAt > createdAt 60초 이상
//    2. memo pre-wrap (이전 수정 유지)
//    3. lightbox={true} (이전 수정 유지)
// ============================================================
"use client";

import { useUIStore }    from "@/store/uiStore";
import { ImageSlider }   from "@/components/common/ImageSlider";
import { StarRating }    from "@/components/common/StarRating";
import { Modal }         from "@/components/common/Modal";
import type { VisitedRecord } from "@/types";

const ROSE  = "#C96B52";
const INK   = "#1A1412";
const MUTED = "#8A8078";

function wasEdited(r: VisitedRecord): boolean {
  if (!r.updatedAt || !r.createdAt) return false;
  return new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() > 60_000;
}

export function DetailModal() {
  const { detailRecord, closeDetail } = useUIStore();
  if (!detailRecord) return null;

  const r    = detailRecord;
  const area = r.district ? `${r.sido} ${r.district}` : r.sido;
  const edited = wasEdited(r);

  return (
    <Modal onClose={closeDetail} maxWidth={440} noPadding>
      <ImageSlider
        images={r.imgUrls}
        emoji={r.emoji}
        height={r.imgUrls.length > 0 ? 220 : 90}
        rounded={false}
        lightbox={true}
      />

      <div style={{ padding: "18px 20px 20px" }}>
        {/* 제목 + 수정됨 뱃지 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: INK }}>{r.name}</h2>
          {edited && (
            <span style={{ fontSize: 10, color: MUTED, background: "#F0EBE3", borderRadius: 10, padding: "2px 8px", flexShrink: 0 }}>수정됨</span>
          )}
        </div>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>{area} · {r.cuisine} · {r.date}</p>
        <StarRating value={r.rating} size={18} />

        {r.memo && (
          <p style={{ marginTop: 12, fontSize: 14, color: INK, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {r.memo}
          </p>
        )}

        {r.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {r.tags.map((t) => (
              <span key={t} style={{ fontSize: 12, padding: "3px 10px", background: "#F0ECE8", color: "#8A6A5A", borderRadius: 20 }}>#{t}</span>
            ))}
          </div>
        )}

        <p style={{ marginTop: 10, fontSize: 14 }}>
          {r.revisit === true ? "❤️ 또 가고 싶어요" : "🤍 한 번이면 충분해요"}
        </p>

        <button
          onClick={closeDetail}
          style={{ width: "100%", marginTop: 18, padding: 13, background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >닫기</button>
      </div>
    </Modal>
  );
}
