// src/components/wishlist/WishModal.tsx
"use client";

import { useState } from "react";
import { SIDO, CUISINES } from "@/types";

const ROSE   = "#C96B52";
const SAGE   = "#6B9E7E";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

interface WishModalProps {
  onClose: () => void;
  onSave:  (data: { name: string; sido: string; district: string; cuisine: string; note: string }) => void;
}

export function WishModal({ onClose, onSave }: WishModalProps) {
  const [name,     setName]     = useState("");
  const [sido,     setSido]     = useState("서울");
  const [district, setDistrict] = useState("");
  const [cuisine,  setCuisine]  = useState("");
  const [note,     setNote]     = useState("");

  const inp: React.CSSProperties = { width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0", padding: "24px 24px calc(24px + 64px)", animation: "slideUp 0.28s cubic-bezier(0.32,1,0.4,1) both" }}>
        <div style={{ width: 36, height: 4, background: BORDER, borderRadius: 2, margin: "0 auto 16px" }} />
        <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 16 }}>가고 싶은 곳 추가</p>

        <input placeholder="식당 이름 *" value={name} onChange={e => setName(e.target.value)} style={{ ...inp, marginBottom: 12 }} />

        {/* 지역 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select value={sido} onChange={e => setSido(e.target.value)} style={{ ...inp, width: "auto", paddingRight: 28, cursor: "pointer" }}>
              {SIDO.map(s => <option key={s}>{s}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: MUTED, pointerEvents: "none" }}>▾</span>
          </div>
          <input placeholder="상세 지역" value={district} onChange={e => setDistrict(e.target.value)} style={{ ...inp, flex: 1 }} />
        </div>

        {/* 음식 종류 */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <select value={cuisine} onChange={e => setCuisine(e.target.value)} style={{ ...inp, paddingRight: 28, cursor: "pointer" }}>
            <option value="">음식 종류 선택</option>
            {CUISINES.map(c => <option key={c}>{c}</option>)}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: MUTED, pointerEvents: "none" }}>▾</span>
        </div>

        <textarea placeholder="가고 싶은 이유" value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ ...inp, resize: "none", marginBottom: 16 }} />

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          <button onClick={() => { if (!name.trim()) return; onSave({ name, sido, district, cuisine, note }); onClose(); }} style={{ flex: 2, padding: 13, background: SAGE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
        </div>
      </div>
    </div>
  );
}
