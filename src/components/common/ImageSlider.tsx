"use client";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils/cn";
interface ImageSliderProps {
  images: string[]; // Firebase Storage URL 배열
  emoji?: string; // 사진 없을 때 폴백 이모지
  height?: number; // 슬라이더 높이 (px), 기본 220
  rounded?: boolean; // 모서리 둥글게 여부, 기본 true
}
export function ImageSlider({
  images,
  emoji = " ",
  height = 220,
  rounded = true,
}: ImageSliderProps) {
  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState<"right" | "left" | null>(null);
  const touchStartX = useRef<number | null>(null);
  /* 슬라이드 이동 — 방향에 따라 애니메이션 클래스 적용 */
  const go = (next: number) => {
    if (next < 0 || next >= images.length || next === idx) return;
    setAnim(next > idx ? "right" : "left");
    setIdx(next);
    setTimeout(() => setAnim(null), 260);
  };
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-cream select-none",
        rounded && "rounded-xl",
      )}
      style={{ height }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (diff < -40) go(idx + 1);
        if (diff > 40) go(idx - 1);
        touchStartX.current = null;
      }}
    >
      {/* 사진이 없으면 이모지 표시 */}
      {images.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text5xl">
          {emoji}
        </div>
      ) : (
        <>
          {/* 현재 사진 */}
          <img
            key={idx}
            src={images[idx]}
            alt=""
            className={cn(
              "w-full h-full object-cover block",
              anim === "right" && "animate-img-right",
              anim === "left" && "animate-img-left",
            )}
          />
          {/* 사진이 2장 이상일 때만 컨트롤 표시 */}
          {images.length > 1 && (
            <>
              {/* 이전 버튼 */}
              {idx > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    go(idx - 1);
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white text-xl flex items-center justifycenter"
                >
                  ‹
                </button>
              )}
              {/* 다음 버튼 */}
              {idx < images.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    go(idx + 1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white text-xl flex items-center justifycenter"
                >
                  ›
                </button>
              )}
              {/* 도트 인디케이터 */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      go(i);
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50",
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
