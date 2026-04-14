// src/components/wishlist/WishModal.tsx
"use client";

import { useState }           from "react";
import { SIDO, CUISINES }     from "@/types";
import { Modal, ModalHeader } from "@/components/common/Modal";

const SAGE   = "#6B9E7E";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

interface WishModalProps {
  onClose: () => void;
  onSave:  (data: {
    name: string; sido: string; district: string;
    cuisine: string; note: string; imgUrls: string[];
  }) => void;
}

export function WishModal({ onClose, onSave }: WishModalProps) {
  const [name,     setName]     = useState("");
  const [sido,     setSido]     = useState("서울");
  const [district, setDistrict] = useState("");
  const [cuisine,  setCuisine]  = useState("");
  const [note,     setNote]     = useState("");
  const [imgUrls,  setImgUrls]  = useState<string[]>([]);

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 13px",
    background: WARM, border: `1px solid ${BORDER}`,
    borderRadius: 10, color: INK, fontSize: 14,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  // 사진 추가 (로컬 미리보기 — Firebase 연동 후 Storage 업로드로 교체)
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - imgUrls.length);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev =>
        setImgUrls(prev => [...prev, ev.target!.result as string].slice(0, 5));
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  return (
    <Modal onClose={onClose} maxWidth={400}>
      <ModalHeader title="가고 싶은 곳 추가" onClose={onClose} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* 사진 추가 */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>📷 사진 추가 (최대 5장)</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {imgUrls.map((url, i) => (
              <div key={i} style={{ position: "relative", width: 72, height: 72 }}>
                <img src={url} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10 }} alt="" />
                <button onClick={() => setImgUrls(p => p.filter((_, j) => j !== i))}
                  style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "#EF4444", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
            ))}
            {imgUrls.length < 5 && (
              <label style={{ width: imgUrls.length === 0 ? 100 : 72, height: imgUrls.length === 0 ? 100 : 72, border: `2px dashed ${BORDER}`, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", background: WARM }}>
                <span style={{ fontSize: 20, color: "#C0B8B0" }}>+</span>
                {imgUrls.length === 0 && <span style={{ fontSize: 10, color: MUTED }}>사진 추가</span>}
                <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFile} />
              </label>
            )}
          </div>
        </div>

        {/* 식당 이름 */}
        <input placeholder="식당 이름 *" value={name} onChange={e => setName(e.target.value)} style={inp} />

        {/* 지역 */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select value={sido} onChange={e => setSido(e.target.value)} style={{ ...inp, width: "auto", paddingRight: 26, cursor: "pointer" }}>
              {SIDO.map(s => <option key={s}>{s}</option>)}
            </select>
            <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: MUTED, pointerEvents: "none" }}>▾</span>
          </div>
          <input placeholder="상세 지역" value={district} onChange={e => setDistrict(e.target.value)} style={{ ...inp, flex: 1 }} />
        </div>

        {/* 음식 종류 */}
        <div style={{ position: "relative" }}>
          <select value={cuisine} onChange={e => setCuisine(e.target.value)} style={{ ...inp, paddingRight: 26, cursor: "pointer" }}>
            <option value="">음식 종류 선택</option>
            {CUISINES.map(c => <option key={c}>{c}</option>)}
          </select>
          <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: MUTED, pointerEvents: "none" }}>▾</span>
        </div>

        {/* 메모 */}
        <textarea placeholder="가고 싶은 이유" value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ ...inp, resize: "none" }} />

        {/* 버튼 */}
        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name, sido, district, cuisine, note, imgUrls });
              onClose();
            }}
            style={{ flex: 2, padding: 13, background: SAGE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >저장</button>
        </div>
      </div>
    </Modal>
  );
}
