// src/components/wishlist/WishModal.tsx
"use client";

import { useState }         from "react";
import { SIDO, CUISINES }   from "@/types";
import { Modal, ModalHeader } from "@/components/common/Modal";

const ROSE   = "#C96B52";
const SAGE   = "#6B9E7E";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

interface WishModalProps {
  onClose: () => void;
  onSave:  (d: { name: string; sido: string; district: string; cuisine: string; note: string }) => void;
}

export function WishModal({ onClose, onSave }: WishModalProps) {
  const [name,     setName]     = useState("");
  const [sido,     setSido]     = useState("서울");
  const [district, setDistrict] = useState("");
  const [cuisine,  setCuisine]  = useState("");
  const [note,     setNote]     = useState("");

  const inp: React.CSSProperties = { width: "100%", padding: "11px 13px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  return (
    <Modal onClose={onClose} maxWidth={400}>
      <ModalHeader title="가고 싶은 곳 추가" onClose={onClose} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input placeholder="식당 이름 *" value={name} onChange={(e) => setName(e.target.value)} style={inp} />

        {/* 지역 */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select value={sido} onChange={(e) => setSido(e.target.value)} style={{ ...inp, width: "auto", paddingRight: 26, cursor: "pointer" }}>
              {SIDO.map((s) => <option key={s}>{s}</option>)}
            </select>
            <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: MUTED, pointerEvents: "none" }}>▾</span>
          </div>
          <input placeholder="상세 지역" value={district} onChange={(e) => setDistrict(e.target.value)} style={{ ...inp, flex: 1 }} />
        </div>

        {/* 음식 */}
        <div style={{ position: "relative" }}>
          <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} style={{ ...inp, paddingRight: 26, cursor: "pointer" }}>
            <option value="">음식 종류 선택</option>
            {CUISINES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: MUTED, pointerEvents: "none" }}>▾</span>
        </div>

        <textarea placeholder="가고 싶은 이유" value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ ...inp, resize: "none" }} />

        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          <button onClick={() => { if (!name.trim()) return; onSave({ name, sido, district, cuisine, note }); onClose(); }} style={{ flex: 2, padding: 13, background: SAGE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
        </div>
      </div>
    </Modal>
  );
}
