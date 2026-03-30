// src/components/common/ImageSlider.tsx
"use client";

import { useState, useRef } from "react";

interface ImageSliderProps {
  images:   string[];
  emoji?:   string;
  height?:  number;
  rounded?: boolean;
}

export function ImageSlider({ images, emoji = "🍽️", height = 220, rounded = true }: ImageSliderProps) {
  const [idx, setIdx]   = useState(0);
  const touchStart      = useRef<number | null>(null);

  const go = (n: number) => {
    if (n < 0 || n >= images.length) return;
    setIdx(n);
  };

  const borderRadius = rounded ? "12px" : "0";

  return (
    <div
      style={{ position: "relative", overflow: "hidden", backgroundColor: "var(--color-cream)", borderRadius, height }}
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
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
          <img
            src={images[idx]}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {images.length > 1 && (
            <>
              {idx > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); go(idx - 1); }}
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}
                >‹</button>
              )}
              {idx < images.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); go(idx + 1); }}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}
                >›</button>
              )}
              <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); go(i); }}
                    style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? "#fff" : "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s" }}
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
