"use client";
import { useState } from "react";
import type { VisitedRecord } from "@/types";
import { ImageSlider } from "@/components/common/ImageSlider";
import { StarRating } from "@/components/common/StarRating";
import { ActionMenu } from "@/components/common/ActionMenu";
import { useUIStore } from "@/store/uiStore";
interface VisitedCardProps {
  record: VisitedRecord;
  onDelete: (id: string) => void;
}
export function VisitedCard({ record, onDelete }: VisitedCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openEditModal, openDetail, openConfirm } = useUIStore();
  /* 지역 문자열: district 있으면 '서울 종로', 없으면 '서울' */
  const area = record.district
    ? `${record.sido} ${record.district}`
    : record.sido;
  return (
    <>
      <div
        className="bg-white rounded-card mb-3.5 overflow-hidden shadow-sm animate-fade-up"
      >
        {/* ── 상단: 이모지 + 식당명 + 위치 + ⋮ ── */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
          onClick={() => openDetail(record)}
        >
          <div
            className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-2xl shrink-0"
          >
            {record.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-bold text-ink truncate"
            >
              {record.name}
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              {area} · {record.cuisine} · {record.authorName}
            </p>
          </div>
          {/* ⋮ 버튼 — 클릭 이벤트가 카드 클릭으로 전파되지 않도록 stopPropagation */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(true);
            }}
            className="text-muted-mid text-xl px-1 py-1"
          >
            ⋮
          </button>
        </div>
        {/* ── 사진 슬라이더 ── */}
        <div onClick={() => openDetail(record)} className="cursor-pointer">
          <ImageSlider
            images={record.imgUrls}
            emoji={record.emoji}
            height={220}
            rounded={false}
          />
        </div>
        {/* ── 하단: 별점 + 재방문 + 메모 + 태그 + 날짜 ── */}
        <div
          className="px-4 py-3"
          onClick={() => openDetail(record)}
          style={{
            cursor: "pointer",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <StarRating value={record.rating} size={16} />
            <span className="text-[18px]">
              {record.revisit === true ? "❤" : " "}
            </span>
          </div>
          <p className="text-sm text-ink leading-relaxed mb-1.5">
            <span className="font-semibold">{record.name}</span> {record.memo}
          </p>
          {record.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {record.tags.map((t) => (
                <span key={t} className="text-[11px] text-tag-text">
                  #{t}
                </span>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-mid">{record.date}</p>
        </div>
      </div>
      {/* ── ⋮ 액션 메뉴 ── */}
      {menuOpen && (
        <ActionMenu
          onEdit={() => {
            openEditModal(record);
            setMenuOpen(false);
          }}
          onDelete={() => {
            openConfirm(
              record.id,
              "visited",
              `"${record.name}" 기록을 삭제하면 복구할 수 없어요.`,
            );
            setMenuOpen(false);
          }}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
