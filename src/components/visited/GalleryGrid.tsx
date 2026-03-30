// src/components/visited/GalleryGrid.tsx
"use client";

import type { VisitedRecord } from "@/types";
import { useUIStore } from "@/store/uiStore";

const CREAM = "#F0EBE3";

export function GalleryGrid({ items }: { items: VisitedRecord[] }) {
  const { openDetail } = useUIStore();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3 }}>
      {items.map((r) => (
        <div key={r.id} onClick={() => openDetail(r)} style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", cursor: "pointer", borderRadius: 4 }}>
          {r.imgUrls.length > 0 ? (
            <img src={r.imgUrls[0]} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{r.emoji}</div>
          )}
          <div style={{ position: "absolute", top: 6, right: 6, fontSize: 14 }}>{r.revisit === true ? "💗" : "🤍"}</div>
        </div>
      ))}
    </div>
  );
}
