// src/app/settings/page.tsx
// 설정 & 마이페이지
"use client";

import { useState }   from "react";
import { useRouter }  from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { calcDDay }   from "@/lib/utils/date";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const SAGE    = "#6B9E7E";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const CREAM   = "#F0EBE3";

// ── 섹션 헤더 ──────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", padding: "20px 20px 8px" }}>
      {title}
    </p>
  );
}

// ── 설정 행 ────────────────────────────────────────────────
function SettingRow({
  icon, label, value, onClick, danger = false, badge,
}: {
  icon: string; label: string; value?: string;
  onClick?: () => void; danger?: boolean; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", background: "#fff", border: "none", borderBottom: `1px solid ${BORDER}`, cursor: onClick ? "pointer" : "default", fontFamily: "inherit", textAlign: "left" }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? "#FFF0F0" : CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: danger ? "#EF4444" : INK }}>{label}</p>
        {value && <p style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{value}</p>}
      </div>
      {badge && (
        <div style={{ background: ROSE_LT, borderRadius: 20, padding: "2px 8px" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: ROSE }}>{badge}</span>
        </div>
      )}
      {onClick && <span style={{ fontSize: 16, color: "#C0B8B0" }}>›</span>}
    </button>
  );
}

// ── 모달 — 닉네임 수정 ────────────────────────────────────
function EditNameModal({ current, onSave, onClose }: { current: string; onSave: (v: string) => void; onClose: () => void }) {
  const [val, setVal] = useState(current);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 20, padding: 24, animation: "scaleIn 0.18s ease both" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 16 }}>닉네임 변경</p>
        <input
          value={val} onChange={e => setVal(e.target.value)}
          maxLength={10}
          style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 14, color: INK, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 4 }}
        />
        <p style={{ fontSize: 11, color: MUTED, marginBottom: 16, textAlign: "right" }}>{val.length}/10</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          <button onClick={() => { if (val.trim()) { onSave(val.trim()); onClose(); } }} style={{ flex: 2, padding: 12, background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
        </div>
      </div>
    </div>
  );
}

// ── 모달 — 교제 시작일 수정 ───────────────────────────────
function EditDateModal({ current, onSave, onClose }: { current: string; onSave: (v: string) => void; onClose: () => void }) {
  const [val, setVal] = useState(current);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 20, padding: 24, animation: "scaleIn 0.18s ease both" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 4 }}>교제 시작일 변경</p>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>D-Day 계산 기준일이 변경됩니다</p>
        <input
          type="date" value={val}
          onChange={e => setVal(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 14, color: INK, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 16 }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          <button onClick={() => { if (val) { onSave(val); onClose(); } }} style={{ flex: 2, padding: 12, background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
        </div>
      </div>
    </div>
  );
}

// ── 모달 — 커플 초대코드 ──────────────────────────────────
function InviteModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"view" | "join">("view");
  const [code, setCode] = useState("");
  // 실제 초대 코드는 authStore 또는 Firestore에서 가져옴
  const myCode = "TASTE-SAMPLE";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 800, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0", padding: "24px 24px 40px", animation: "slideUp 0.28s cubic-bezier(0.32,1,0.4,1) both" }}>
        <div style={{ width: 36, height: 4, background: BORDER, borderRadius: 2, margin: "0 auto 20px" }} />
        <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 20 }}>커플 연동</p>

        <div style={{ display: "flex", background: WARM, borderRadius: 12, padding: 3, border: `1px solid ${BORDER}`, marginBottom: 20 }}>
          {(["view", "join"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "9px", border: "none", borderRadius: 9, background: mode === m ? "#fff" : "transparent", color: mode === m ? ROSE : MUTED, fontSize: 13, fontWeight: mode === m ? 700 : 400, cursor: "pointer", fontFamily: "inherit", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
              {m === "view" ? "내 코드 보기" : "코드 입력하기"}
            </button>
          ))}
        </div>

        {mode === "view" ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>파트너에게 아래 코드를 전달하세요</p>
            <div style={{ background: ROSE_LT, borderRadius: 14, padding: "18px", marginBottom: 16 }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: ROSE, letterSpacing: 4 }}>{myCode}</p>
            </div>
            <button onClick={() => navigator.clipboard.writeText(myCode)} style={{ fontSize: 13, color: ROSE, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>코드 복사</button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>파트너의 초대 코드를 입력하세요</p>
            <input placeholder="TASTE-XXXXXX" value={code} onChange={e => setCode(e.target.value.toUpperCase())} style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 16, fontWeight: 600, letterSpacing: 3, textAlign: "center", color: INK, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
            <button style={{ width: "100%", padding: 13, background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>커플 연동하기</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 메인 설정 페이지 ──────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const { myName, partnerName, startDate, role, setMyName, setStartDate } = useAuthStore();

  const dday = calcDDay(startDate);

  const [editName,    setEditName]    = useState(false);
  const [editDate,    setEditDate]    = useState(false);
  const [showInvite,  setShowInvite]  = useState(false);
  const [showLogout,  setShowLogout]  = useState(false);
  const [showDelete,  setShowDelete]  = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", maxWidth: 480, margin: "0 auto", fontFamily: "inherit" }}>

      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: MUTED, lineHeight: 1, padding: "0 4px 0 0" }}>‹</button>
        <p style={{ fontSize: 17, fontWeight: 700, color: INK }}>설정</p>
      </div>

      {/* 프로필 카드 */}
      <div style={{ margin: "16px 16px 0", background: "#fff", borderRadius: 20, padding: "20px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* 프로필 아이콘 */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: ROSE, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 26, fontWeight: 700 }}>
              {myName[0]}
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: SAGE, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, position: "absolute", bottom: -4, right: -8 }}>
              {partnerName[0]}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: INK }}>{myName}</p>
              {/* 회원 등급 배지 */}
              {role === "admin" && (
                <div style={{ background: "#7B6BAE", borderRadius: 20, padding: "2px 8px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>관리자</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: 13, color: MUTED }}>{myName} ❤️ {partnerName}</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: ROSE_LT, borderRadius: 20, padding: "3px 10px", marginTop: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: ROSE }}>💑 D+{dday}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: 40 }}>

        {/* 내 프로필 */}
        <SectionHeader title="내 프로필" />
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          <SettingRow icon="✏️" label="닉네임 변경" value={myName} onClick={() => setEditName(true)} />
        </div>

        {/* 커플 정보 */}
        <SectionHeader title="커플 정보" />
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          <SettingRow icon="💑" label="교제 시작일" value={`${startDate} (D+${dday})`} onClick={() => setEditDate(true)} />
          <SettingRow icon="🔗" label="커플 연동 / 초대 코드" onClick={() => setShowInvite(true)} />
        </div>

        {/* 앱 정보 */}
        <SectionHeader title="앱 정보" />
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          <SettingRow icon="ℹ️" label="앱 버전" value="1.0.0" />
          <SettingRow icon="📄" label="개인정보 처리방침" onClick={() => {}} />
          <SettingRow icon="📋" label="서비스 이용약관" onClick={() => {}} />
          <SettingRow icon="💬" label="고객센터 / 문의하기" value="ourtaste@gmail.com" onClick={() => {}} />
        </div>

        {/* 관리자 메뉴 — role이 admin인 경우에만 표시 */}
        {role === "admin" && (
          <>
            <SectionHeader title="관리자" />
            <div style={{ borderTop: `1px solid ${BORDER}` }}>
              <SettingRow icon="🛡️" label="관리자 페이지" value="신고 처리 · 게시물 관리" onClick={() => router.push("/admin")} badge="ADMIN" />
            </div>
          </>
        )}

        {/* 계정 */}
        <SectionHeader title="계정" />
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          <SettingRow icon="🚪" label="로그아웃" onClick={() => setShowLogout(true)} danger />
          <SettingRow icon="⚠️" label="회원 탈퇴" onClick={() => setShowDelete(true)} danger />
        </div>
      </div>

      {/* 닉네임 수정 모달 */}
      {editName && <EditNameModal current={myName} onSave={v => setMyName(v)} onClose={() => setEditName(false)} />}

      {/* 교제 시작일 수정 모달 */}
      {editDate && <EditDateModal current={startDate} onSave={v => setStartDate(v)} onClose={() => setEditDate(false)} />}

      {/* 커플 연동 모달 */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {/* 로그아웃 확인 */}
      {showLogout && (
        <div onClick={() => setShowLogout(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 300, background: "#fff", borderRadius: 20, padding: 28, textAlign: "center", animation: "scaleIn 0.18s ease both" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 8 }}>로그아웃 하시겠어요?</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>다시 로그인하면 기록이 그대로 있어요.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogout(false)} style={{ flex: 1, padding: 12, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
              <button onClick={() => { setShowLogout(false); router.push("/login"); }} style={{ flex: 1, padding: 12, background: "#EF4444", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>로그아웃</button>
            </div>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 확인 */}
      {showDelete && (
        <div onClick={() => setShowDelete(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 300, background: "#fff", borderRadius: 20, padding: 28, textAlign: "center", animation: "scaleIn 0.18s ease both" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#EF4444", marginBottom: 8 }}>정말 탈퇴하시겠어요?</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 6, lineHeight: 1.6 }}>탈퇴하면 모든 기록이 삭제되며 복구할 수 없습니다.</p>
            <p style={{ fontSize: 12, color: "#EF4444", marginBottom: 24 }}>커플 기록도 함께 삭제됩니다.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDelete(false)} style={{ flex: 1, padding: 12, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
              <button style={{ flex: 1, padding: 12, background: "#EF4444", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>탈퇴</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
