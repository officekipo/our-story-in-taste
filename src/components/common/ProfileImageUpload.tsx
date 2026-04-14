// ============================================================
//  ProfileImageUpload.tsx
//  적용 경로: src/components/common/ProfileImageUpload.tsx
//
//  사용법 (settings/page.tsx 에서):
//    <ProfileImageUpload />
// ============================================================
"use client";

import { useState, useRef }  from "react";
import { doc, updateDoc }    from "firebase/firestore";
import { db }                from "@/lib/firebase/config";
import { uploadImage }       from "@/lib/firebase/storage";
import { useAuthStore }      from "@/store/authStore";

const ROSE  = "#C96B52";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";
const WARM  = "#FAF7F3";

export function ProfileImageUpload() {
  const { myUid, profileImgUrl, setProfileImgUrl } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [pct,       setPct]       = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !myUid) return;
    e.target.value = "";

    setUploading(true);
    try {
      const path = `users/${myUid}/profile.jpg`;
      const url  = await uploadImage(file, path, setPct);

      // Firestore users/{uid} 에 저장
      await updateDoc(doc(db, "users", myUid), { profileImgUrl: url });

      // authStore 즉시 반영
      setProfileImgUrl(url);
    } catch (err) {
      console.error(err);
      alert("업로드에 실패했어요. 다시 시도해주세요.");
    } finally {
      setUploading(false);
      setPct(0);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {/* 프로필 사진 원형 */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{ position: "relative", width: 88, height: 88, cursor: uploading ? "default" : "pointer" }}
      >
        <div style={{ width: 88, height: 88, borderRadius: "50%", background: ROSE, border: "3px solid #F2D5CC", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {profileImgUrl
            ? <img src={profileImgUrl} alt="프로필" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 32, color: "#fff", fontWeight: 800 }}>
                {useAuthStore.getState().myName?.[0] ?? "?"}
              </span>
          }
        </div>

        {/* 카메라 뱃지 */}
        {!uploading && (
          <div style={{ position: "absolute", bottom: 2, right: 2, width: 26, height: 26, borderRadius: "50%", background: "#fff", border: `2px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={MUTED} strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4" stroke={MUTED} strokeWidth="2"/>
            </svg>
          </div>
        )}

        {/* 업로드 중 오버레이 */}
        {uploading && (
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{pct}%</span>
          </div>
        )}
      </div>

      {/* 안내 텍스트 */}
      <p style={{ fontSize: 12, color: MUTED }}>
        {uploading ? "업로드 중..." : "사진을 눌러 변경"}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </div>
  );
}
