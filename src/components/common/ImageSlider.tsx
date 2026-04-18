// ============================================================
//  ImageSlider.tsx  적용 경로: src/components/common/ImageSlider.tsx
//
//  Fix: lightbox prop 추가
//    - lightbox={true} 전달 시 이미지 클릭 → 전체화면 원본 뷰어
//    - 뷰어에서 좌우 스와이프 / 버튼으로 슬라이드 이동 가능
//    - 배경 클릭 or ✕ 버튼으로 닫기
// ============================================================
"use client";

import { useState, useRef } from "react";

interface ImageSliderProps {
  images:    string[];
  emoji?:    string;
  height?:   number;
  rounded?:  boolean;
  lightbox?: boolean;   // ★ true 이면 이미지 클릭 시 전체화면 뷰어
}

export function ImageSlider({ images, emoji = "🍽️", height = 220, rounded = true, lightbox = false }: ImageSliderProps) {
  const [idx,         setIdx]         = useState(0);
  const [animating,   setAnimating]   = useState(false);
  const [slideDir,    setSlideDir]    = useState<"left" | "right" | null>(null);
  const [lbOpen,      setLbOpen]      = useState(false);   // ★ 라이트박스 상태
  const [lbIdx,       setLbIdx]       = useState(0);       // ★ 라이트박스 인덱스
  const touchStart    = useRef<number | null>(null);
  const lbTouchStart  = useRef<number | null>(null);

  const borderRadius = rounded ? "12px" : "0";

  const go = (next: number) => {
    if (next < 0 || next >= images.length || animating) return;
    const dir = next > idx ? "left" : "right";
    setSlideDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setIdx(next);
      setAnimating(false);
      setSlideDir(null);
    }, 280);
  };

  const nextIdx = slideDir === "left"
    ? Math.min(idx + 1, images.length - 1)
    : Math.max(idx - 1, 0);

  const openLightbox = (startIdx: number) => {
    if (!lightbox || images.length === 0) return;
    setLbIdx(startIdx);
    setLbOpen(true);
  };

  const lbGo = (next: number) => {
    if (next < 0 || next >= images.length) return;
    setLbIdx(next);
  };

  return (
    <>
      {/* ── 슬라이더 ── */}
      <div
        style={{ position: "relative", overflow: "hidden", backgroundColor: "#F0EBE3", borderRadius, height, cursor: lightbox && images.length > 0 ? "zoom-in" : "default" }}
        onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchStart.current === null) return;
          const diff = e.changedTouches[0].clientX - touchStart.current;
          if (diff < -40) go(idx + 1);
          if (diff > 40)  go(idx - 1);
          touchStart.current = null;
        }}
        onClick={() => openLightbox(idx)}
      >
        {images.length === 0 ? (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>
            {emoji}
          </div>
        ) : (
          <>
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
            {animating && (
              <img
                key={`next-${nextIdx}`}
                src={images[nextIdx]}
                alt=""
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%", objectFit: "cover",
                  transform: "translateX(0)",
                  insetInlineStart: slideDir === "left" ? "100%" : "-100%",
                  transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1), inset-inline-start 0s",
                }}
              />
            )}
            {images.length > 1 && idx > 0 && (
              <button onClick={e => { e.stopPropagation(); go(idx - 1); }} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
            )}
            {images.length > 1 && idx < images.length - 1 && (
              <button onClick={e => { e.stopPropagation(); go(idx + 1); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            )}
            {images.length > 1 && (
              <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2 }}>
                {images.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); go(i); }} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? "#fff" : "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)" }} />
                ))}
              </div>
            )}
            {/* ★ 라이트박스 힌트 아이콘 */}
            {lightbox && (
              <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.35)", borderRadius: 6, padding: "3px 6px", zIndex: 2, pointerEvents: "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </>
        )}
      </div>

      {/* ★ 라이트박스 전체화면 뷰어 */}
      {lbOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onTouchStart={e => { lbTouchStart.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (lbTouchStart.current === null) return;
            const diff = e.changedTouches[0].clientX - lbTouchStart.current;
            if (diff < -40) lbGo(lbIdx + 1);
            if (diff > 40)  lbGo(lbIdx - 1);
            lbTouchStart.current = null;
          }}
          onClick={() => setLbOpen(false)}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={() => setLbOpen(false)}
            style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
          >✕</button>

          {/* 인덱스 표시 */}
          {images.length > 1 && (
            <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
              {lbIdx + 1} / {images.length}
            </div>
          )}

          {/* 이미지 */}
          <img
            src={images[lbIdx]}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: "100vw", maxHeight: "100vh", objectFit: "contain", userSelect: "none" }}
          />

          {/* 이전 버튼 */}
          {lbIdx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); lbGo(lbIdx - 1); }}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >‹</button>
          )}

          {/* 다음 버튼 */}
          {lbIdx < images.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); lbGo(lbIdx + 1); }}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >›</button>
          )}

          {/* 하단 도트 */}
          {images.length > 1 && (
            <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); lbGo(i); }}
                  style={{ width: i === lbIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === lbIdx ? "#fff" : "rgba(255,255,255,0.35)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s" }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
