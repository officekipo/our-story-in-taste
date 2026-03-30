// src/components/visited/DetailModal.tsx
"use client";

import { useUIStore }    from "@/store/uiStore";
import { ImageSlider }   from "@/components/common/ImageSlider";
import { StarRating }    from "@/components/common/StarRating";

const ROSE   = "#C96B52";
const INK    = "#1A1412";
const MUTED  = "#8A8078";

export function DetailModal() {
  const { detailRecord, closeDetail } = useUIStore();
  if (!detailRecord) return null;

  const r    = detailRecord;
  const area = r.district ? `${r.sido} ${r.district}` : r.sido;

  return (
    <div onClick={closeDetail} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0", maxHeight: "85vh", overflowY: "auto", animation: "slideUp 0.28s cubic-bezier(0.32,1,0.4,1) both" }}>
        <ImageSlider images={r.imgUrls} emoji={r.emoji} height={220} rounded={false} />
        <div style={{ padding: "20px 20px calc(32px + 64px)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 4 }}>{r.name}</h2>
          <p style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>{area} · {r.cuisine} · {r.date}</p>
          <StarRating value={r.rating} size={18} />
          {r.memo && <p style={{ marginTop: 12, fontSize: 14, color: INK, lineHeight: 1.7 }}>{r.memo}</p>}
          {r.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {r.tags.map((t) => <span key={t} style={{ fontSize: 12, padding: "3px 10px", background: "#F0ECE8", color: "#8A6A5A", borderRadius: 20 }}>#{t}</span>)}
            </div>
          )}
          <p style={{ marginTop: 10, fontSize: 14 }}>{r.revisit === true ? "❤️ 또 가고 싶어요" : "🤍 한 번이면 충분해요"}</p>
          <button onClick={closeDetail} style={{ width: "100%", marginTop: 20, padding: 14, background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>닫기</button>
        </div>
      </div>
    </div>
  );
}
