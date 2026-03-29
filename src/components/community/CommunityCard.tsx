"use client";
import type { CommunityRecord } from "@/types";
import { ImageSlider } from "@/components/common/ImageSlider";
import { FlagIcon } from "@/components/common/Icons";
interface CommunityCardProps {
  record: CommunityRecord;
  isLiked: boolean;
  isWished: boolean;
  onLike: () => void;
  onWish: () => void;
  onReport: () => void;
}
export function CommunityCard({
  record,
  isLiked,
  isWished,
  onLike,
  onWish,
  onReport,
}: CommunityCardProps) {
  return (
    <div
      className="bg-white rounded-card mb-4 overflow-hidden shadow-sm animate-fade-up"
    >
      {/* 풀너비 사진 슬라이더 */}
      <ImageSlider
        images={record.imgUrls}
        emoji={record.emoji}
        height={200}
        rounded={false}
      />
      <div className="p-4">
        <h3 className="text-lg font-bold text-ink mb-1.5">{record.name}</h3>
        <p className="text-xs text-muted mb-2.5">
          {record.sido}
          {record.district ? ` ${record.district}` : ""} ·{record.cuisine}
        </p>
        {/* 커플 뱃지 */}
        <div className="inline-flex items-center gap-1.5 bg-rose-light roundedfull px-3 py-1 mb-3">
          <span className="text-sm">❤</span>
          <span className="text-xs font-semibold text-rosedark">
            {record.coupleLabel}
          </span>
        </div>
        {record.memo && (
          <p className="text-sm text-ink leading-relaxed mb2.5">
            {record.memo}
          </p>
        )}
        {/* 태그 */}
        {record.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {record.tags.map((t) => (
              <span
                key={t}
                className="text-xs px-2.5 py-1 bg-tag-bg text-tagtext rounded-full"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
        {/* 하단: 좋아요 + 신고 + 위시 추가 */}
        <div
          className="flex items-center justify-between border-t border-muted-light pt-3"
        >
          {/* 좋아요 */}
          <button
            onClick={onLike}
            className="flex items-center gap-1.5 text-sm"
            style={{
              color: isLiked ? "#C96B52" : "#8A8078",
              fontWeight: isLiked ? 600 : 400,
            }}
          >
            <span className="text-base">{isLiked ? "❤" : " "}</span>
            {record.likes + (isLiked ? 1 : 0)}
          </button>
          <div className="flex gap-2 items-center">
            {/* 신고 */}
            <button onClick={onReport} className="text-muted-mid p-1">
              <FlagIcon color="#C0B8B0" size={16} />
            </button>
            {/* 위시 추가 */}
            <button
              onClick={onWish}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full textxs font-semibold transition-all"
              style={{
                background: isWished ? "#C8DED1" : "#6B9E7E",
                color: isWished ? "#4A7A5E" : "#fff",
              }}
            >
              {isWished ? "위시 완료" : "위시 추가"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
