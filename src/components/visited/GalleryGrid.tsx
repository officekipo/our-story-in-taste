"use client";
import type { VisitedRecord } from "@/types";
import { useUIStore } from "@/store/uiStore";
interface GalleryGridProps {
  items: VisitedRecord[];
}
export function GalleryGrid({ items }: GalleryGridProps) {
  const { openDetail } = useUIStore();
  return (
    /* gap-[3px]: 셀 사이 3px 간격 */
    <div className="grid grid-cols-3 gap-[3px]">
      {items.map((r) => (
        <div
          key={r.id}
          onClick={() => openDetail(r)}
          className="relative aspect-square overflow-hidden cursor-pointer rounded-[4px]"
        >
          {/* 사진이 있으면 이미지, 없으면 이모지 */}
          {r.imgUrls.length > 0 ? (
            <img
              src={r.imgUrls[0]}
              alt={r.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-cream flex items-center justifycenter text-3xl">
              {r.emoji}
            </div>
          )}
          {/* 재방문 하트 — 우상단 */}
          <div className="absolute top-1.5 right-1.5 text-sm">
            {r.revisit === true ? " " : " "}
          </div>
        </div>
      ))}
    </div>
  );
}
