// src/components/common/ImageSlider.tsx
// 부드러운 translateX 슬라이드 애니메이션 적용
"use client";

import { useState, useRef } from "react";

interface ImageSliderProps {
  images:   string[];
  emoji?:   string;
  height?:  number;
  rounded?: boolean;
}

export function ImageSlider({ images, emoji = "🍽️", height = 220, rounded = true }: ImageSliderProps) {
  const [idx,       setIdx]       = useState(0);
  const [animating, setAnimating] = useState(false);
  const [slideDir,  setSlideDir]  = useState<"left" | "right" | null>(null);
  const touchStart = useRef<number | null>(null);

  const borderRadius = rounded ? "12px" : "0";

  const go = (next: number) => {
    if (next < 0 || next >= images.length || animating) return;
    const dir = next > idx ? "left" : "right";
    setSlideDir(dir);
    setAnimating(true);
    // 애니메이션 끝나면 인덱스 변경
    setTimeout(() => {
      setIdx(next);
      setAnimating(false);
      setSlideDir(null);
    }, 280);
  };

  // 슬라이드 방향에 따른 다음 이미지 위치
  const nextIdx = slideDir === "left"
    ? Math.min(idx + 1, images.length - 1)
    : Math.max(idx - 1, 0);

  return (
    <div
      style={{ position: "relative", overflow: "hidden", backgroundColor: "#F0EBE3", borderRadius, height }}
      onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchStart.current === null) return;
        const diff = e.changedTouches[0].clientX - touchStart.current;
        if (diff < -40) go(idx + 1);
        if (diff > 40)  go(idx - 1);
        touchStart.current = null;
      }}
    >
      {images.length === 0 ? (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>
          {emoji}
        </div>
      ) : (
        <>
          {/* 현재 이미지 — 슬라이드 아웃 */}
          <img
            key={`cur-${idx}`}
            src={images[idx]}
            alt=""
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%", objectFit: "cover",
              transform: animating
                ? slideDir === "left"  ? "translateX(-100%)"
                : slideDir === "right" ? "translateX(100%)"
                : "translateX(0)"
                : "translateX(0)",
              transition: animating ? "transform 0.28s cubic-bezier(0.4,0,0.2,1)" : "none",
            }}
          />

          {/* 다음 이미지 — 슬라이드 인 */}
          {animating && (
            <img
              key={`next-${nextIdx}`}
              src={images[nextIdx]}
              alt=""
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%", objectFit: "cover",
                transform: animating
                  ? "translateX(0)"
                  : slideDir === "left"  ? "translateX(100%)"
                  : "translateX(-100%)",
                // 들어오는 방향에서 시작
                insetInlineStart: slideDir === "left" ? "100%" : "-100%",
                transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1), inset-inline-start 0s",
              }}
            />
          )}

          {/* 이전 버튼 */}
          {images.length > 1 && idx > 0 && (
            <button onClick={e => { e.stopPropagation(); go(idx - 1); }} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          )}

          {/* 다음 버튼 */}
          {images.length > 1 && idx < images.length - 1 && (
            <button onClick={e => { e.stopPropagation(); go(idx + 1); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          )}

          {/* 도트 인디케이터 */}
          {images.length > 1 && (
            <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2 }}>
              {images.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); go(i); }} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? "#fff" : "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)" }} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
