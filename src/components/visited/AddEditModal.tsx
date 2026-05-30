// ============================================================
//  AddEditModal.tsx  적용 경로: src/components/visited/AddEditModal.tsx
//
//  Fix / Add:
//    ★ 새 글 저장 시 같은 이름 + 유사 좌표(또는 이름만) 가게 감지
//      → "재방문으로 덧붙이기 / 새 기록으로 추가" 선택 팝업
//    ★ 재방문 선택 시 onAddVisit(existingId, entryData) 호출
//    ★ 메인 폼 모달을 bottomSheet로 전환 — 스와이프 닫기 지원
//       (dupTarget 확인 팝업은 작은 중앙 다이얼로그로 유지)
//    기존 수정:
//      useEffect로 모달 열릴 때마다 폼 초기화
// ============================================================
"use client";

import { useState, useEffect }        from "react";
import { useUIStore }             from "@/store/uiStore";
import { useAuthStore }           from "@/store/authStore";
import { CalendarPicker }         from "./CalendarPicker";
import { StarRating }             from "@/components/common/StarRating";
import { Modal }                  from "@/components/common/Modal";
import { KakaoPlaceSearch }       from "@/components/common/KakaoPlaceSearch";
import { SIDO, CUISINES }         from "@/types";
import { todayStr }               from "@/lib/utils/date";
import type { VisitedFormData, VisitedRecord } from "@/types";

const DUMMY_MODE = false;

const ROSE   = "#C96B52";
const ROSE_LT= "#F2D5CC";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";
const CREAM  = "#F0EBE3";

const EXPANDED_TAGS = [
  "데이트", "분위기 좋은", "조용한", "왁자지껄", "인스타감성", "루프탑",
  "야경 맛집", "감성 카페", "숨은 맛집", "현지인 맛집",
  "맛있어요", "또 가고 싶어요", "가성비 최고", "양 많음", "특별한 맛",
  "담백해요", "진해요", "매워요", "달콤해요", "신선해요",
  "친절해요", "서비스 좋음", "주차 편함", "웨이팅 있음", "예약 필수",
  "반려동물 동반", "아이 동반", "혼밥 가능", "단체 모임",
  "기념일", "생일", "프로포즈", "첫 방문", "재방문", "특별한 날",
  "점심 추천", "저녁 추천", "브런치", "야식",
];

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 13px",
  background: WARM, border: `1px solid ${BORDER}`,
  borderRadius: 10, color: INK, fontSize: 14,
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

// 두 좌표 사이 거리 (km) — Haversine 간이 계산
function distKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dG = ((lng2 - lng1) * Math.PI) / 180;
  const a  = Math.sin(dL / 2) ** 2 +
             Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 같은 가게 판별: 이름 일치 + (좌표 500m 이내 | 좌표 없으면 이름만)
function findDuplicate(
  records: VisitedRecord[],
  name: string,
  lat?: number,
  lng?: number
): VisitedRecord | undefined {
  const trimmed = name.trim().toLowerCase();
  return records.find((r) => {
    if (r.name.trim().toLowerCase() !== trimmed) return false;
    if (lat != null && lng != null && r.lat != null && r.lng != null) {
      return distKm(lat, lng, r.lat, r.lng) < 0.5;
    }
    // 좌표 없으면 이름만으로 판별
    return true;
  });
}

interface AddEditModalProps {
  onSave?:     (data: VisitedFormData, imgUrls: string[]) => void;
  onAddVisit?: (existingId: string, entry: { date: string; rating: 1|2|3|4|5; memo: string; imgUrls: string[]; revisit: boolean | null }) => void;
  existingRecords?: VisitedRecord[];
}

export function AddEditModal({ onSave, onAddVisit, existingRecords = [] }: AddEditModalProps) {
  const { addModalOpen, editTarget, closeModal } = useUIStore();
  const { coupleId, myUid, myName }               = useAuthStore();

  // ── 폼 상태 ──────────────────────────────────────────────
  const [name,       setName]       = useState("");
  const [sido,       setSido]       = useState("서울");
  const [district,   setDistrict]   = useState("");
  const [cuisine,    setCuisine]    = useState("");
  const [rating,     setRating]     = useState<1|2|3|4|5>(5);
  const [date,       setDate]       = useState(todayStr());
  const [memo,       setMemo]       = useState("");
  const [tags,       setTags]       = useState<string[]>([]);
  const [revisit,    setRevisit]    = useState<boolean|null>(null);
  const [share,      setShare]      = useState(false);
  const [hideAuthor, setHideAuthor] = useState(false);
  const [imgUrls,    setImgUrls]    = useState<string[]>([]);
  const [lat,        setLat]        = useState<number | undefined>(undefined);
  const [lng,        setLng]        = useState<number | undefined>(undefined);
  const [showCal,    setShowCal]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);

  // ★ 재방문 팝업 상태
  const [dupTarget,  setDupTarget]  = useState<VisitedRecord | null>(null);

  // 모달 열릴 때마다 폼 초기화
  useEffect(() => {
    if (!addModalOpen) return;

    setName      (editTarget?.name        ?? "");
    setSido      (editTarget?.sido        ?? "서울");
    setDistrict  (editTarget?.district    ?? "");
    setCuisine   (editTarget?.cuisine     ?? "");
    setRating    ((editTarget?.rating     ?? 5) as 1|2|3|4|5);
    setDate      (editTarget?.date        ?? todayStr());
    setMemo      (editTarget?.memo        ?? "");
    setTags      (editTarget?.tags        ?? []);
    setRevisit   (editTarget?.revisit     ?? null);
    setShare     (editTarget?.shareToComm ?? false);
    setHideAuthor(editTarget?.hideAuthor  ?? false);
    setImgUrls   (editTarget?.imgUrls     ?? []);
    setLat       (editTarget?.lat);
    setLng       (editTarget?.lng);
    setShowCal   (false);
    setDupTarget (null);
  }, [addModalOpen, editTarget]);

  if (!addModalOpen) return null;

  const isEdit = !!(editTarget?.id && editTarget.id !== "__from_wish__");

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
      // ★ 커플 미연동 시 myUid fallback 사용 (Storage 규칙: 인증된 유저 허용)
      const storageId = coupleId || myUid;
      if (!storageId) return;
      setUploading(true);
      try {
        const { uploadImages } = await import("@/lib/firebase/storage");
        const urls = await uploadImages(storageId, files, pct => setUploadPct(pct));
        setImgUrls(prev => [...prev, ...urls].slice(0, 5));
      } catch {
        alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setUploading(false);
        setUploadPct(0);
      }
    }
  };

  // ── 좌표 자동 조회 ─────────────────────────────────────
  const resolveCoords = async (
    targetLat: number | undefined,
    targetLng: number | undefined,
    targetName: string,
    targetSido: string
  ): Promise<{ lat?: number; lng?: number }> => {
    if (targetLat != null) return { lat: targetLat, lng: targetLng };
    if (!targetName.trim() || !process.env.NEXT_PUBLIC_KAKAO_REST_KEY) return {};
    try {
      const q   = encodeURIComponent(`${targetSido} ${targetName.trim()}`);
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${q}&size=1`,
        { headers: { Authorization: `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_REST_KEY}` } }
      );
      if (res.ok) {
        const json = await res.json();
        const d    = json.documents?.[0];
        if (d) return { lat: parseFloat(d.y), lng: parseFloat(d.x) };
      }
    } catch { /* 무시 */ }
    return {};
  };

  // ── 저장 버튼 ─────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim() || !cuisine) return;

    const coords = await resolveCoords(lat, lng, name, sido);
    const finalLat = coords.lat;
    const finalLng = coords.lng;

    // ★ 수정 모드는 중복 검사 생략
    if (!isEdit) {
      const dup = findDuplicate(existingRecords, name, finalLat, finalLng);
      if (dup) {
        setDupTarget(dup);
        return; // 팝업 표시 → 사용자 선택 대기
      }
    }

    doSave(finalLat, finalLng);
  };

  const doSave = (finalLat?: number, finalLng?: number) => {
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

  // ★ 재방문으로 덧붙이기 선택
  const handleMerge = () => {
    if (!dupTarget) return;
    onAddVisit?.(dupTarget.id, {
      date,
      rating,
      memo,
      imgUrls,
      revisit,
    });
    closeModal();
  };

  // ★ 새 기록으로 추가 선택 (팝업 닫고 그냥 저장)
  const handleForceNew = async () => {
    setDupTarget(null);
    const coords = await resolveCoords(lat, lng, name, sido);
    doSave(coords.lat, coords.lng);
  };

  // ── 재방문 팝업 — 작은 중앙 다이얼로그 유지 ──────────────
  if (dupTarget) {
    const visitCount = (dupTarget.visits?.length ?? 0) + 1; // 기존 visits + 이번까지
    return (
      <Modal onClose={() => setDupTarget(null)} maxWidth={380}>
        <div style={{ textAlign: "center", padding: "4px 0 8px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{dupTarget.emoji}</div>
          <p style={{ fontSize: 16, fontWeight: 800, color: INK, marginBottom: 6 }}>
            {dupTarget.name}에 또 다녀왔군요! 😊
          </p>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 20 }}>
            이미 기록된 맛집이에요.<br />
            재방문으로 덧붙일까요, 새 기록으로 추가할까요?
          </p>

          {/* 방문 횟수 미리보기 */}
          <div style={{ background: CREAM, borderRadius: 12, padding: "10px 16px", marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🔁</span>
            <span style={{ fontSize: 13, color: "#8C4A38", fontWeight: 700 }}>
              재방문으로 추가하면 총 {visitCount + 1}번째 방문이 돼요
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleMerge}
              className="tap"
              style={{ width: "100%", padding: "14px 0", background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              🔁 재방문으로 덧붙이기
            </button>
            <button
              onClick={handleForceNew}
              className="tap"
              style={{ width: "100%", padding: "14px 0", background: WARM, border: `1.5px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              ✚ 새 기록으로 추가하기
            </button>
            <button
              onClick={() => setDupTarget(null)}
              className="tap"
              style={{ background: "none", border: "none", color: "#C0B8B0", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 2 }}
            >
              돌아가기
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── 메인 폼 — ★ bottomSheet 적용 ──────────────────────
  return (
    <Modal onClose={() => { setShowCal(false); closeModal(); }} maxWidth={440} bottomSheet>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: INK }}>
          {isEdit ? "맛집 기록 수정" : "새로운 맛집 기록하기"}
        </p>
        <button onClick={closeModal}
          className="tap"
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
                  className="tap"
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
              <div style={{ flex: 1, height: 4, background: ROSE_LT, borderRadius: 2, overflow: "hidden" }}>
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
              <CalendarPicker
                value={date}
                onChange={v => { setDate(v); setShowCal(false); }}
                onClose={() => setShowCal(false)}
              />
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
            {EXPANDED_TAGS.map(t => {
              const on = tags.includes(t);
              return (
                <button key={t} onClick={() => toggleTag(t)}
                  className="tap"
                  style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${on ? ROSE : BORDER}`, background: on ? ROSE_LT : WARM, color: on ? ROSE : MUTED, fontSize: 12, fontWeight: on ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
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
            className="tap"
            style={{ width: "100%", padding: 13, marginBottom: 8, borderRadius: 12, border: `1.5px solid ${revisit === true ? ROSE : BORDER}`, background: revisit === true ? "#FDE8E5" : WARM, color: revisit === true ? ROSE : MUTED, fontSize: 14, fontWeight: revisit === true ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
            💝 또 가고 싶어요!
          </button>
          <button onClick={() => setRevisit(false)}
            className="tap"
            style={{ width: "100%", padding: 13, borderRadius: 12, border: `1.5px solid ${revisit === false ? "#C0B8B0" : BORDER}`, background: revisit === false ? CREAM : WARM, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
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
                  className="tap"
                  style={{ flex: 1, padding: "9px 6px", borderRadius: 10, border: `1.5px solid ${!hideAuthor ? ROSE : BORDER}`, background: !hideAuthor ? ROSE_LT : "#fff", color: !hideAuthor ? ROSE : MUTED, fontSize: 12, fontWeight: !hideAuthor ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                  👤 {myName}(으)로 공개
                </button>
                <button onClick={() => setHideAuthor(true)}
                  className="tap"
                  style={{ flex: 1, padding: "9px 6px", borderRadius: 10, border: `1.5px solid ${hideAuthor ? ROSE : BORDER}`, background: hideAuthor ? ROSE_LT : "#fff", color: hideAuthor ? ROSE : MUTED, fontSize: 12, fontWeight: hideAuthor ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
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
          className="tap"
          style={{ width: "100%", padding: 15, background: name && cuisine ? ROSE : "#C0B8B0", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: name && cuisine ? "pointer" : "default", fontFamily: "inherit" }}>
          {isEdit ? "수정 완료" : "기록 저장하기"}
        </button>
      </div>
    </Modal>
  );
}
