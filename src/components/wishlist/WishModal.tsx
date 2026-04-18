// ============================================================
//  WishModal.tsx  적용 경로: src/components/wishlist/WishModal.tsx
//
//  Fix:
//    1. 이미지 업로드: base64(FileReader) → Firebase Storage 실제 업로드
//       → base64가 Firestore에 저장되면 1MB 초과 오류 + Storage DELETE 오류 발생
//    2. 수정 모드: editRecord prop으로 기존 이미지/내용 pre-fill (이전 수정 유지)
//    3. 업로드 진행률 표시
// ============================================================
"use client";

import { useState }                              from "react";
import { SIDO, CUISINES }                        from "@/types";
import { Modal, ModalHeader }                    from "@/components/common/Modal";
import { KakaoPlaceSearch, KakaoPlace }          from "@/components/common/KakaoPlaceSearch";
import { useAuthStore }                          from "@/store/authStore";
import type { WishRecord }                       from "@/types";

const SAGE   = "#6B9E7E";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";
const ROSE   = "#C96B52";

interface WishModalProps {
  onClose:     () => void;
  onSave:      (data: {
    name: string; sido: string; district: string;
    cuisine: string; note: string; imgUrls: string[];
    lat?: number; lng?: number;
  }) => void;
  editRecord?: WishRecord;   // 수정 모드: 기존 데이터 pre-fill
}

export function WishModal({ onClose, onSave, editRecord }: WishModalProps) {
  const { coupleId } = useAuthStore();

  // ★ editRecord 있으면 기존 값으로 초기화
  const [name,       setName]       = useState(editRecord?.name     ?? "");
  const [sido,       setSido]       = useState(editRecord?.sido     ?? "서울");
  const [district,   setDistrict]   = useState(editRecord?.district ?? "");
  const [cuisine,    setCuisine]    = useState(editRecord?.cuisine  ?? "");
  const [note,       setNote]       = useState(editRecord?.note     ?? "");
  const [imgUrls,    setImgUrls]    = useState<string[]>(editRecord?.imgUrls ?? []);
  const [lat,        setLat]        = useState<number | undefined>(editRecord?.lat);
  const [lng,        setLng]        = useState<number | undefined>(editRecord?.lng);
  const [uploading,  setUploading]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 13px",
    background: WARM, border: `1px solid ${BORDER}`,
    borderRadius: 10, color: INK, fontSize: 14,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  const handlePlaceSelect = (place: KakaoPlace) => {
    setName(place.name);
    setSido(place.sido);
    setDistrict(place.district);
    setCuisine(place.cuisine);
    setLat(place.lat);
    setLng(place.lng);
  };

  // ★ Fix: Firebase Storage 실제 업로드 (base64 저장 제거)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - imgUrls.length);
    if (!files.length) return;
    e.target.value = "";

    if (!coupleId) {
      alert("커플 연동 후 사진을 업로드할 수 있어요.");
      return;
    }

    setUploading(true);
    try {
      const { uploadImages } = await import("@/lib/firebase/storage");
      const urls = await uploadImages(coupleId, files, (pct) => setUploadPct(pct));
      setImgUrls((prev) => [...prev, ...urls].slice(0, 5));
    } catch {
      alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  const isEdit = !!editRecord;

  return (
    <Modal onClose={onClose} maxWidth={400}>
      <ModalHeader title={isEdit ? "가고 싶은 곳 수정" : "가고 싶은 곳 추가"} onClose={onClose} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* 사진 추가 */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>📷 사진 추가 (최대 5장)</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {imgUrls.map((url, i) => (
              <div key={i} style={{ position: "relative", width: 72, height: 72 }}>
                <img src={url} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10 }} alt="" />
                <button onClick={() => setImgUrls((p) => p.filter((_, j) => j !== i))}
                  style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "#EF4444", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
            ))}
            {imgUrls.length < 5 && (
              <label style={{ width: imgUrls.length === 0 ? 100 : 72, height: imgUrls.length === 0 ? 100 : 72, border: `2px dashed ${BORDER}`, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: uploading ? "default" : "pointer", background: WARM, opacity: uploading ? 0.6 : 1 }}>
                <span style={{ fontSize: 20, color: "#C0B8B0" }}>+</span>
                {imgUrls.length === 0 && <span style={{ fontSize: 10, color: MUTED }}>사진 추가</span>}
                <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFile} disabled={uploading} />
              </label>
            )}
          </div>
          {/* 업로드 진행률 */}
          {uploading && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: "#F2D5CC", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${uploadPct}%`, background: SAGE, borderRadius: 2, transition: "width 0.2s" }} />
              </div>
              <span style={{ fontSize: 11, color: MUTED }}>{uploadPct}%</span>
            </div>
          )}
        </div>

        {/* 식당 검색 */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>
            🔍 식당 검색
            {lat && lng && (
              <span style={{ marginLeft: 8, color: SAGE, fontWeight: 500 }}>📍 위치 등록됨</span>
            )}
          </p>
          <KakaoPlaceSearch
            value={name}
            onChange={(v) => {
              setName(v);
              setLat(undefined);
              setLng(undefined);
            }}
            onSelect={handlePlaceSelect}
          />
        </div>

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

        {/* 음식 종류 */}
        <div style={{ position: "relative" }}>
          <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} style={{ ...inp, paddingRight: 26, cursor: "pointer" }}>
            <option value="">음식 종류 선택</option>
            {CUISINES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: MUTED, pointerEvents: "none" }}>▾</span>
        </div>

        {/* 메모 */}
        <textarea placeholder="가고 싶은 이유" value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ ...inp, resize: "none" }} />

        {/* 버튼 */}
        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onSave({
                name, sido, district, cuisine, note, imgUrls,
                ...(lat != null && { lat }),
                ...(lng != null && { lng }),
              });
              onClose();
            }}
            style={{ flex: 2, padding: 13, background: SAGE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >{isEdit ? "수정 완료" : "저장"}</button>
        </div>
      </div>
    </Modal>
  );
}
