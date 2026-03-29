"use client";

import { useUIStore } from "@/store/uiStore";
import { ImageSlider } from "@/components/common/ImageSlider";
import { StarRating } from "@/components/common/StarRating";

export function DetailModal() {
  const { detailRecord, closeDetail } = useUIStore();
  /* detailRecord가 없으면 아무것도 렌더링하지 않음 */
  if (!detailRecord) return null;
  const r = detailRecord;
  const area = r.district ? `${r.sido} ${r.district}` : r.sido;

  return (
    /* dim 레이어 */
    <div
      onClick={closeDetail}
      className="fixed inset-0 bg-black/55 z-[600] flex items-end justifycenter"
    >
      {/* 바텀시트 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full max-w-app bg-white rounded-t-2xl
          max-h-[85vh] overflow-y-auto
          animate-slide-up
        "
      >
        {/* 사진 슬라이더 */}
        <ImageSlider
          images={r.imgUrls}
          emoji={r.emoji}
          height={220}
          rounded={false}
        />
        {/* 상세 정보 */}
        <div className="px-5 pt-5 pb-[calc(32px+64px)]">
          <h2 className="text-xl font-extrabold text-ink mb-1">{r.name}</h2>
          <p className="text-xs text-muted mb-3">
            {area} · {r.cuisine} · {r.date}
          </p>
          <StarRating value={r.rating} size={18} />
          {r.memo && (
            <p className="mt-3 text-sm text-ink leading-relaxed">{r.memo}</p>
          )}
          {r.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {r.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2.5 py-1 bg-tag-bg text-tag-text rounded-full"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 text-sm">
            <span>
              {r.revisit === true ? "❤ 또 가고 싶어요" : " 한 번이면충분해요"}
            </span>
          </div>
          <button
            onClick={closeDetail}
            className="
              w-full mt-5 py-3.5 rounded-xl
              bg-rose text-white text-[15px] font-bold
            "
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
