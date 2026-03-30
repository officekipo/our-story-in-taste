// src/components/visited/AddEditModal.tsx
"use client";

import { useState, useRef }       from "react";
import { useUIStore }             from "@/store/uiStore";
import { useAuthStore }           from "@/store/authStore";
import { CalendarPicker }         from "./CalendarPicker";
import { StarRating }             from "@/components/common/StarRating";
import { SIDO, CUISINES, TAGS }   from "@/types";
import { todayStr }               from "@/lib/utils/date";
import type { VisitedFormData }   from "@/types";

const ROSE   = "#C96B52";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

const inp: React.CSSProperties = { width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

interface AddEditModalProps {
  onSave?: (data: VisitedFormData, imgUrls: string[]) => void;
}

export function AddEditModal({ onSave }: AddEditModalProps) {
  const { addModalOpen, editTarget, closeModal } = useUIStore();
  const { myName } = useAuthStore();

  const [name,     setName]     = useState(editTarget?.name     ?? "");
  const [sido,     setSido]     = useState(editTarget?.sido     ?? "서울");
  const [district, setDistrict] = useState(editTarget?.district ?? "");
  const [cuisine,  setCuisine]  = useState(editTarget?.cuisine  ?? "");
  const [rating,   setRating]   = useState<1|2|3|4|5>(editTarget?.rating ?? 5);
  const [date,     setDate]     = useState(editTarget?.date     ?? todayStr());
  const [memo,     setMemo]     = useState(editTarget?.memo     ?? "");
  const [tags,     setTags]     = useState<string[]>(editTarget?.tags ?? []);
  const [revisit,  setRevisit]  = useState<boolean | null>(editTarget?.revisit ?? null);
  const [share,    setShare]    = useState(editTarget?.shareToComm ?? false);
  const [imgUrls,  setImgUrls]  = useState<string[]>(editTarget?.imgUrls ?? []);
  const [showCal,  setShowCal]  = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  if (!addModalOpen) return null;

  const toggleTag = (t: string) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - imgUrls.length);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setImgUrls(prev => [...prev, ev.target!.result as string].slice(0, 5));
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const handleSave = () => {
    if (!name.trim() || !cuisine) return;
    const data: VisitedFormData = { name, sido, district, cuisine, rating, date, memo, tags, revisit, imgUrls, emoji: "🍽️", lat: undefined, lng: undefined, shareToComm: share };
    onSave?.(data, imgUrls);
    closeModal();
  };

  return (
    <div onClick={() => { setShowCal(false); closeModal(); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 750, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 20, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "scaleIn 0.18s ease both" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 0" }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: INK }}>{editTarget ? "맛집 기록 수정" : "새로운 맛집 기록하기"}</p>
          <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: MUTED, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* 사진 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>📷 음식 사진 (최대 5장)</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {imgUrls.map((url, i) => (
                <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                  <img src={url} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10 }} alt="" />
                  <button onClick={() => setImgUrls(prev => prev.filter((_, j) => j !== i))} style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "#EF4444", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>
              ))}
              {imgUrls.length === 0 && (
                <label style={{ width: 120, height: 120, border: `2px dashed ${BORDER}`, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", background: WARM }}>
                  <span style={{ fontSize: 28, color: "#C0B8B0" }}>+</span>
                  <span style={{ fontSize: 11, color: MUTED }}>사진 추가</span>
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFile} />
                </label>
              )}
              {imgUrls.length > 0 && imgUrls.length < 5 && (
                <label style={{ width: 80, height: 80, border: `2px dashed ${BORDER}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: WARM }}>
                  <span style={{ fontSize: 24, color: "#C0B8B0" }}>+</span>
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFile} />
                </label>
              )}
            </div>
          </div>

          {/* 식당 이름 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>식당 이름 *</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="예: 을지로 이자카야" style={inp} />
          </div>

          {/* 위치 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>📍 위치</p>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <select value={sido} onChange={e => setSido(e.target.value)} style={{ ...inp, width: "auto", paddingRight: 28, cursor: "pointer" }}>
                  {SIDO.map(s => <option key={s}>{s}</option>)}
                </select>
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: MUTED, pointerEvents: "none" }}>▾</span>
              </div>
              <input value={district} onChange={e => setDistrict(e.target.value)} placeholder="상세 지역 (예: 종로구)" style={{ ...inp, flex: 1 }} />
            </div>
          </div>

          {/* 음식 종류 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>🍽️ 음식 종류 *</p>
            <div style={{ position: "relative" }}>
              <select value={cuisine} onChange={e => setCuisine(e.target.value)} style={{ ...inp, paddingRight: 28, cursor: "pointer" }}>
                <option value="">선택하세요</option>
                {CUISINES.map(c => <option key={c}>{c}</option>)}
              </select>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: MUTED, pointerEvents: "none" }}>▾</span>
            </div>
          </div>

          {/* 날짜 */}
          <div style={{ position: "relative" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>📅 방문 날짜 *</p>
            <div onClick={() => setShowCal(!showCal)} style={{ ...inp, cursor: "pointer", color: date ? INK : MUTED }}>
              {date || "날짜를 선택하세요"}
            </div>
            {showCal && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 900 }}>
                <CalendarPicker value={date} onChange={v => { setDate(v); setShowCal(false); }} onClose={() => setShowCal(false)} />
              </div>
            )}
          </div>

          {/* 별점 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>☆ 평점</p>
            <StarRating value={rating} onChange={v => setRating(v as 1|2|3|4|5)} size={32} />
          </div>

          {/* 메모 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>이 순간 기록하기</p>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="이 순간을 기억하고 싶어요..." rows={4} style={{ ...inp, resize: "none", lineHeight: 1.6 }} />
          </div>

          {/* 태그 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>태그</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TAGS.map(t => {
                const on = tags.includes(t);
                return (
                  <button key={t} onClick={() => toggleTag(t)} style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${on ? ROSE : BORDER}`, background: on ? "#F2D5CC" : WARM, color: on ? ROSE : MUTED, fontSize: 12, fontWeight: on ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                    #{t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 재방문 의향 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>재방문 의향</p>
            <button onClick={() => setRevisit(true)} style={{ width: "100%", padding: 13, marginBottom: 8, borderRadius: 12, border: `1.5px solid ${revisit === true ? ROSE : BORDER}`, background: revisit === true ? "#FDE8E5" : WARM, color: revisit === true ? ROSE : MUTED, fontSize: 14, fontWeight: revisit === true ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
              💝 또 가고 싶어요!
            </button>
            <button onClick={() => setRevisit(false)} style={{ width: "100%", padding: 13, borderRadius: 12, border: `1.5px solid ${revisit === false ? "#C0B8B0" : BORDER}`, background: revisit === false ? "#F0EBE3" : WARM, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              😌 한 번이면 충분해요
            </button>
          </div>

          {/* 커뮤니티 공유 */}
          <div style={{ background: WARM, borderRadius: 12, padding: "12px 14px", border: `1px solid ${BORDER}` }}>
            <div onClick={() => setShare(!share)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${share ? ROSE : "#C0B8B0"}`, background: share ? ROSE : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {share && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: INK }}>커플들에게 추천하기 💬</p>
                <p style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>추천 탭에 공유됩니다</p>
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <button onClick={handleSave} style={{ width: "100%", padding: 15, background: name && cuisine ? ROSE : "#C0B8B0", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: name && cuisine ? "pointer" : "default", fontFamily: "inherit" }}>
            {editTarget ? "수정 완료" : "기록 저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
