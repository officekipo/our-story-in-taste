// src/components/common/Modal.tsx
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  onClose:      () => void;
  children:     React.ReactNode;
  maxWidth?:    number;
  noPadding?:   boolean;
  /** 바텀시트 모드: 하단에서 올라오며 스와이프로 닫기 가능 */
  bottomSheet?: boolean;
}

export function Modal({
  onClose,
  children,
  maxWidth    = 400,
  noPadding   = false,
  bottomSheet = false,
}: ModalProps) {

  // ── Portal 마운트 대상 (SSR 안전) ────────────────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── 닫힘 애니메이션 상태 ──────────────────────────────
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    const duration = bottomSheet ? 240 : 160;
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, duration);
  }, [closing, bottomSheet, onClose]);

  // ── 바텀시트 전용 드래그 상태 ─────────────────────────
  const scrollRef    = useRef<HTMLDivElement>(null);
  const startY       = useRef(0);
  const startX       = useRef(0);
  const everDragged  = useRef(false);
  const [dragY,  setDragY]  = useState(0);
  const [snap,   setSnap]   = useState(false);
  const [useTf,  setUseTf]  = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    startX.current = e.touches[0].clientX;
    setSnap(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const el    = scrollRef.current;
    const atTop = !el || el.scrollTop <= 0;
    const dy    = e.touches[0].clientY - startY.current;
    const dx    = Math.abs(e.touches[0].clientX - startX.current);

    if (dx > Math.abs(dy) * 0.8) {
      if (dragY > 0) setDragY(0);
      return;
    }

    if (atTop && dy > 0) {
      if (!everDragged.current) {
        everDragged.current = true;
        setUseTf(true);
      }
      setDragY(dy);
    } else if (dragY > 0) {
      setDragY(0);
    }
  };

  const onTouchEnd = () => {
    if (dragY > 100) {
      onClose();
      setDragY(0);
    } else if (dragY > 0) {
      setSnap(true);
      setDragY(0);
    }
  };

  /* ─────────────────────────────────────────────────────────
     바텀시트 모드
  ───────────────────────────────────────────────────────── */
  if (bottomSheet) {
    const overlayAlpha = closing
      ? 0
      : Math.max(0, 0.55 - dragY / 500).toFixed(2);

    let sheetAnimation  = "none";
    let sheetTransform  = `translateY(${dragY}px)`;
    let sheetTransition = snap ? "transform 0.32s cubic-bezier(0.32,1,0.4,1)" : "none";

    if (closing) {
      sheetAnimation  = "slideDown 0.24s cubic-bezier(0.4,0,1,1) both";
      sheetTransform  = "none";
      sheetTransition = "none";
    } else if (!useTf) {
      sheetAnimation = "slideUp 0.28s cubic-bezier(0.32,1,0.4,1) both";
    }

    const content = (
      <div
        onClick={handleClose}
        style={{
          position:       "fixed",
          inset:          0,
          background:     `rgba(0,0,0,${overlayAlpha})`,
          zIndex:         9999,
          display:        "flex",
          alignItems:     "flex-end",
          justifyContent: "center",
          transition:     closing ? "background 0.22s ease" : "none",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            position:      "relative",
            width:         "100%",
            maxWidth:      480,
            maxHeight:     "calc(100dvh - 60px)",
            background:    "#fff",
            borderRadius:  "20px 20px 0 0",
            boxShadow:     "0 -4px 30px rgba(0,0,0,0.15)",
            overflow:      "hidden",
            display:       "flex",
            flexDirection: "column",
            animation:     sheetAnimation,
            transform:     sheetTransform,
            transition:    sheetTransition,
            willChange:    "transform",
          }}
        >
          {/* 드래그 핸들 */}
          <div
            style={{
              position:       noPadding ? "absolute" : "relative",
              top:            noPadding ? 8 : "auto",
              left:           0,
              right:          0,
              zIndex:         10,
              display:        "flex",
              justifyContent: "center",
              padding:        noPadding ? 0 : "10px 0 6px",
              flexShrink:     0,
              pointerEvents:  "none",
            }}
          >
            <div
              style={{
                width: 36, height: 4, borderRadius: 2,
                background: noPadding ? "rgba(255,255,255,0.65)" : "#E2DDD8",
              }}
            />
          </div>

          {/* 스크롤 영역 */}
          <div
            ref={scrollRef}
            style={{
              flex:      1,
              overflowY: "auto",
              overflowX: "hidden",
              padding:   noPadding ? 0 : "8px 24px 32px",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );

    if (!mounted) return null;
    return createPortal(content, document.body);
  }

  /* ─────────────────────────────────────────────────────────
     중앙 모달
  ───────────────────────────────────────────────────────── */
  const content = (
    <div
      onClick={handleClose}
      style={{
        position:       "fixed",
        inset:          0,
        background:     closing ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.55)",
        zIndex:         9999,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        20,
        transition:     closing ? "background 0.14s ease" : "none",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width:        "100%",
          maxWidth,
          maxHeight:    "calc(100dvh - 40px)",
          background:   "#fff",
          borderRadius: 20,
          boxShadow:    "0 8px 40px rgba(0,0,0,0.18)",
          overflowY:    "auto",
          overflowX:    "hidden",
          animation:    closing
            ? "scaleOut 0.16s ease both"
            : "scaleIn 0.18s ease both",
          padding:      noPadding ? 0 : "24px 24px 28px",
        }}
      >
        {children}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}

export function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1412" }}>{title}</p>
      <button
        onClick={onClose}
        className="tap"
        style={{ width: 28, height: 28, borderRadius: "50%", background: "#F5F0EB", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#8A8078" }}
      >✕</button>
    </div>
  );
}
