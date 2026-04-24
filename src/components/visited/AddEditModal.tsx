// ============================================================
//  AddEditModal.tsx  적용 경로: src/components/visited/AddEditModal.tsx
//
//  Fix: 태그 목록 대폭 확장 (기존 TAGS import → 로컬 상세 태그 배열)
// ============================================================
"use client";

import { useState }               from "react";
import { useUIStore }             from "@/store/uiStore";
import { useAuthStore }           from "@/store/authStore";
import { CalendarPicker }         from "./CalendarPicker";
import { StarRating }             from "@/components/common/StarRating";
import { Modal }                  from "@/components/common/Modal";
import { KakaoPlaceSearch }       from "@/components/common/KakaoPlaceSearch";
import { SIDO, CUISINES }         from "@/types";
import { todayStr }               from "@/lib/utils/date";
import type { VisitedFormData }   from "@/types";

const DUMMY_MODE = false;

const ROSE  = "#C96B52";
const INK   = "#1A1412";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";
const WARM  = "#FAF7F3";

// ★ 태그 목록 대폭 확장
const EXPANDED_TAGS = [
  // 분위기
  "데이트", "분위기 좋은", "조용한", "왁자지껄", "인스타감성", "루프탑",
  "야경 맛집", "감성 카페", "숨은 맛집", "현지인 맛집",
  // 맛
  "맛있어요", "또 가고 싶어요", "가성비 최고", "양 많음", "특별한 맛",
  "담백해요", "진해요", "매워요", "달콤해요", "신선해요",
  // 서비스/편의
  "친절해요", "서비스 좋음", "주차 편함", "웨이팅 있음", "예약 필수",
  "반려동물 동반", "아이 동반", "혼밥 가능", "단체 모임",
  // 기념일/특별함
  "기념일", "생일", "프로포즈", "첫 방문", "재방문", "특별한 날",
  // 시간대
  "점심 추천", "저녁 추천", "브런치", "야식",
];

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 13px",
  background: WARM, border: `1px solid ${BORDER}`,
  borderRadius: 10, color: INK, fontSize: 14,
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

interface AddEditModalProps {
  onSave?: (data: VisitedFormData, imgUrls: string[]) => void;
}

export function AddEditModal({ onSave }: AddEditModalProps) {
  const { addModalOpen, editTarget, closeModal } = useUIStore();
  const { coupleId, myName }                     = useAuthStore();

  const [name,       setName]       = useState(editTarget?.name     ?? "");
  const [sido,       setSido]       = useState(editTarget?.sido     ?? "서울");
  const [district,   setDistrict]   = useState(editTarget?.district ?? "");
  const [cuisine,    setCuisine]    = useState(editTarget?.cuisine  ?? "");
  const [rating,     setRating]     = useState<1|2|3|4|5>(editTarget?.rating ?? 5);
  const [date,       setDate]       = useState(editTarget?.date     ?? todayStr());
  const [memo,       setMemo]       = useState(editTarget?.memo     ?? "");
  const [tags,       setTags]       = useState<string[]>(editTarget?.tags   ?? []);
  const [revisit,    setRevisit]    = useState<boolean|null>(editTarget?.revisit ?? null);
  const [share,      setShare]      = useState(editTarget?.shareToComm ?? false);
  const [hideAuthor, setHideAuthor] = useState(editTarget?.hideAuthor  ?? false);
  const [imgUrls,    setImgUrls]    = useState<string[]>(editTarget?.imgUrls ?? []);
  const [lat,        setLat]        = useState<number | undefined>(editTarget?.lat);
  const [lng,        setLng]        = useState<number | undefined>(editTarget?.lng);
  const [showCal,    setShowCal]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);

  if (!addModalOpen) return null;

  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - imgUrls.length);
    if (!files.length) return;
    e.target.value = "";

    if (DUMMY_MODE) {
      files.forEach(f => {
        const reader = new FileReader();
        reader.onload = ev =>
          setImgUrls(prev => [...prev, ev.target!.result as string].slice(0, 5));
        reader.readAsDataURL(f);
      });
    } else {
      if (!coupleId) return;
      setUploading(true);
      try {
        const { uploadImages } = await import("@/lib/firebase/storage");
        const urls = await uploadImages(coupleId, files, pct => setUploadPct(pct));
        setImgUrls(prev => [...prev, ...urls].slice(0, 5));
      } catch {
        alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setUploading(false);
        setUploadPct(0);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !cuisine) return;

    // ★ KakaoPlaceSearch 미선택(직접 입력)으로 lat/lng 없을 때 자동 좌표 조회
    let finalLat = lat;
    let finalLng = lng;
    if (finalLat == null && name.trim() && process.env.NEXT_PUBLIC_KAKAO_REST_KEY) {
      try {
        const q   = encodeURIComponent(`${sido} ${name.trim()}`);
        const res = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${q}&size=1`,
          { headers: { Authorization: `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_REST_KEY}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const d    = data.documents?.[0];
          if (d) { finalLat = parseFloat(d.y); finalLng = parseFloat(d.x); }
        }
      } catch { /* 좌표 조회 실패 시 무시 */ }
    }

    const data: VisitedFormData = {
      name, sido, district, cuisine, rating, date, memo,
      tags, revisit, imgUrls, emoji: "🍽️",
      shareToComm: share, hideAuthor,
      ...(finalLat != null && { lat: finalLat }),
      ...(finalLng != null && { lng: finalLng }),
    };
    onSave?.(data, imgUrls);
    closeModal();
  };

  return (
    <Modal onClose={() => { setShowCal(false); closeModal(); }} maxWidth={440}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: INK }}>
          {editTarget?.id && editTarget.id !== "__from_wish__" ? "맛집 기록 수정" : "새로운 맛집 기록하기"}
        </p>
        <button onClick={closeModal}
          style={{ width: 28, height: 28, borderRadius: "50%", background: "#F5F0EB", border: "none", cursor: "pointer", fontSize: 14, color: MUTED }}>✕</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* 사진 */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>📷 음식 사진 (최대 5장)</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {imgUrls.map((url, i) => (
              <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                <img src={url} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10 }} alt="" />
                <button onClick={() => setImgUrls(p => p.filter((_, j) => j !== i))}
                  style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "#EF4444", border: "none", color: "#fff", fontSize: 11, cursor: "pointer" }}>×</button>
              </div>
            ))}
            {imgUrls.length < 5 && (
              <label style={{ width: imgUrls.length === 0 ? 120 : 80, height: imgUrls.length === 0 ? 120 : 80, border: `2px dashed ${BORDER}`, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: uploading ? "default" : "pointer", background: WARM, opacity: uploading ? 0.6 : 1 }}>
                <span style={{ fontSize: 22, color: "#C0B8B0" }}>+</span>
                {imgUrls.length === 0 && <span style={{ fontSize: 10, color: MUTED }}>사진 추가</span>}
                <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFile} disabled={uploading} />
              </label>
            )}
          </div>
          {uploading && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: "#F2D5CC", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${uploadPct}%`, background: ROSE, borderRadius: 2, transition: "width 0.2s" }} />
              </div>
              <span style={{ fontSize: 11, color: MUTED }}>{uploadPct}%</span>
            </div>
          )}
        </div>

        {/* 식당 이름 */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>식당 이름 *</p>
          <KakaoPlaceSearch
            value={name}
            onChange={setName}
            onSelect={(place) => {
              setName(place.name);
              setSido(place.sido);
              setDistrict(place.district);
              if (place.cuisine) setCuisine(place.cuisine);
              setLat(place.lat);
              setLng(place.lng);
            }}
          />
          {lat != null && (
            <p style={{ fontSize: 10, color: "#6B9E7E", marginTop: 4 }}>📍 위치 자동 입력됨 ({lat.toFixed(4)}, {lng?.toFixed(4)})</p>
          )}
        </div>

        {/* 위치 */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>📍 위치</p>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <select value={sido} onChange={e => setSido(e.target.value)} style={{ ...inp, width: "auto", paddingRight: 26, cursor: "pointer" }}>
                {SIDO.map(s => <option key={s}>{s}</option>)}
              </select>
              <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: MUTED, pointerEvents: "none" }}>▾</span>
            </div>
            <input value={district} onChange={e => setDistrict(e.target.value)} placeholder="상세 지역 (예: 종로구)" style={{ ...inp, flex: 1 }} />
          </div>
        </div>

        {/* 음식 종류 */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>🍽️ 음식 종류 *</p>
          <div style={{ position: "relative" }}>
            <select value={cuisine} onChange={e => setCuisine(e.target.value)} style={{ ...inp, paddingRight: 26, cursor: "pointer" }}>
              <option value="">선택하세요</option>
              {CUISINES.map(c => <option key={c}>{c}</option>)}
            </select>
            <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: MUTED, pointerEvents: "none" }}>▾</span>
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

        {/* ★ 태그 — 확장된 목록 */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>태그</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {EXPANDED_TAGS.map(t => {
              const on = tags.includes(t);
              return (
                <button key={t} onClick={() => toggleTag(t)}
                  style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${on ? ROSE : BORDER}`, background: on ? "#F2D5CC" : WARM, color: on ? ROSE : MUTED, fontSize: 12, fontWeight: on ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                  #{t}
                </button>
              );
            })}
          </div>
        </div>

        {/* 재방문 */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>재방문 의향</p>
          <button onClick={() => setRevisit(true)}
            style={{ width: "100%", padding: 13, marginBottom: 8, borderRadius: 12, border: `1.5px solid ${revisit === true ? ROSE : BORDER}`, background: revisit === true ? "#FDE8E5" : WARM, color: revisit === true ? ROSE : MUTED, fontSize: 14, fontWeight: revisit === true ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
            💝 또 가고 싶어요!
          </button>
          <button onClick={() => setRevisit(false)}
            style={{ width: "100%", padding: 13, borderRadius: 12, border: `1.5px solid ${revisit === false ? "#C0B8B0" : BORDER}`, background: revisit === false ? "#F0EBE3" : WARM, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            😌 한 번이면 충분해요
          </button>
        </div>

        {/* 커뮤니티 공유 */}
        <div style={{ background: WARM, borderRadius: 12, padding: 14, border: `1px solid ${BORDER}` }}>
          <div onClick={() => setShare(!share)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: share ? 12 : 0 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${share ? ROSE : "#C0B8B0"}`, background: share ? ROSE : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {share && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: INK }}>커플들에게 추천하기 💬</p>
              <p style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>추천 탭에 공유됩니다</p>
            </div>
          </div>
          {share && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>닉네임 공개 여부</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setHideAuthor(false)}
                  style={{ flex: 1, padding: "9px 6px", borderRadius: 10, border: `1.5px solid ${!hideAuthor ? ROSE : BORDER}`, background: !hideAuthor ? "#F2D5CC" : "#fff", color: !hideAuthor ? ROSE : MUTED, fontSize: 12, fontWeight: !hideAuthor ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                  👤 {myName}(으)로 공개
                </button>
                <button onClick={() => setHideAuthor(true)}
                  style={{ flex: 1, padding: "9px 6px", borderRadius: 10, border: `1.5px solid ${hideAuthor ? ROSE : BORDER}`, background: hideAuthor ? "#F2D5CC" : "#fff", color: hideAuthor ? ROSE : MUTED, fontSize: 12, fontWeight: hideAuthor ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                  🙈 익명으로 공유
                </button>
              </div>
              <p style={{ fontSize: 11, color: "#C0B8B0", marginTop: 6, textAlign: "center" }}>
                {hideAuthor ? `커뮤니티에 "익명 커플"로 표시됩니다` : `커뮤니티에 "${myName}"으로 표시됩니다`}
              </p>
            </div>
          )}
        </div>

        {/* 저장 */}
        <button onClick={handleSave}
          style={{ width: "100%", padding: 15, background: name && cuisine ? ROSE : "#C0B8B0", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: name && cuisine ? "pointer" : "default", fontFamily: "inherit" }}>
          {editTarget?.id && editTarget.id !== "__from_wish__" ? "수정 완료" : "기록 저장하기"}
        </button>
      </div>
    </Modal>
  );
}
