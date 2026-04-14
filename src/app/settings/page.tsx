// src/app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter }            from "next/navigation";
import { useAuthStore }         from "@/store/authStore";
import { calcDDay }             from "@/lib/utils/date";
import {
  loadNotifSettings, saveNotifSettings,
  requestNotificationPermission,
  type NotificationSettings,
} from "@/lib/firebase/notifications";

/* ── 상수 ── */
export const APP_VERSION = "1.0.0";
export const COMPANY_NAME = "Our Taste Inc.";
export const SUPPORT_EMAIL = "support@ourtaste.app";

const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const SAGE    = "#6B9E7E";
const PURPLE  = "#7B6BAE";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const CREAM   = "#F0EBE3";

/* ── 공용 서브 컴포넌트 ── */
function SectionLabel({ title }: { title: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase", padding: "20px 20px 8px" }}>
      {title}
    </p>
  );
}

function Row({ icon, label, value, sub, onClick, danger = false, rightEl }: {
  icon: string; label: string; value?: string; sub?: string;
  onClick?: () => void; danger?: boolean; rightEl?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", background: "#fff", border: "none", borderBottom: `1px solid ${BORDER}`, cursor: onClick ? "pointer" : "default", fontFamily: "inherit", textAlign: "left" }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? "#FFF5F5" : CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: danger ? "#EF4444" : INK }}>{label}</p>
        {(value || sub) && <p style={{ fontSize: 12, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}{sub ? ` · ${sub}` : ""}</p>}
      </div>
      {rightEl ?? (onClick && <span style={{ fontSize: 18, color: "#C0B8B0", flexShrink: 0 }}>›</span>)}
    </button>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onToggle(); }}
      style={{ width: 44, height: 26, borderRadius: 13, background: on ? ROSE : "#E2DDD8", cursor: "pointer", position: "relative", transition: "background 0.25s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.25s" }} />
    </div>
  );
}

/* ── 팝업 래퍼 ── */
function Popup({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 20, padding: 24, animation: "scaleIn 0.18s ease both" }}>
        {children}
      </div>
    </div>
  );
}

/* ── 닉네임 수정 팝업 ── */
function EditNamePopup({ current, onSave, onClose }: { current: string; onSave: (v: string) => void; onClose: () => void }) {
  const [val, setVal] = useState(current);
  return (
    <Popup onClose={onClose}>
      <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 16 }}>닉네임 변경</p>
      <input value={val} onChange={(e) => setVal(e.target.value)} maxLength={10} autoFocus
        style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 14, color: INK, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 4 }} />
      <p style={{ fontSize: 11, color: MUTED, textAlign: "right", marginBottom: 16 }}>{val.length}/10</p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: 12, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
        <button onClick={() => { if (val.trim()) { onSave(val.trim()); onClose(); } }} style={{ flex: 2, padding: 12, background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
      </div>
    </Popup>
  );
}

/* ── 교제 시작일 수정 팝업 ── */
function EditDatePopup({ current, onSave, onClose }: { current: string; onSave: (v: string) => void; onClose: () => void }) {
  const [val, setVal] = useState(current);
  return (
    <Popup onClose={onClose}>
      <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 4 }}>교제 시작일 변경</p>
      <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>D-Day 계산 기준일이 바뀝니다</p>
      <input type="date" value={val} onChange={(e) => setVal(e.target.value)} max={new Date().toISOString().slice(0, 10)}
        style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 14, color: INK, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: 12, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
        <button onClick={() => { if (val) { onSave(val); onClose(); } }} style={{ flex: 2, padding: 12, background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
      </div>
    </Popup>
  );
}

/* ── 커플 초대코드 팝업 ── */
function InvitePopup({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"show" | "enter">("show");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const { coupleId } = useAuthStore();
  const [myCode,    setMyCode]    = useState("불러오는 중...");
  const [codeError, setCodeError] = useState(false);

  // Firestore에서 실제 초대 코드 로드
  useEffect(() => {
    if (!coupleId) {
      setMyCode("미연동");
      return;
    }
    import("@/lib/firebase/auth").then(({ fetchCouple }) => {
      fetchCouple(coupleId)
        .then(couple => {
          if (couple?.inviteCode) setMyCode(couple.inviteCode);
          else setMyCode("코드 없음");
        })
        .catch(() => setCodeError(true));
    });
  }, [coupleId]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, background: "#fff", borderRadius: 20, padding: 24, animation: "scaleIn 0.18s ease both" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 20 }}>커플 연동</p>
        <div style={{ display: "flex", background: WARM, borderRadius: 12, padding: 3, border: `1px solid ${BORDER}`, marginBottom: 20 }}>
          {(["show", "enter"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "9px", border: "none", borderRadius: 9, background: mode === m ? "#fff" : "transparent", color: mode === m ? ROSE : MUTED, fontSize: 13, fontWeight: mode === m ? 700 : 400, cursor: "pointer", fontFamily: "inherit", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
              {m === "show" ? "내 코드 보기" : "코드 입력하기"}
            </button>
          ))}
        </div>
        {mode === "show" ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>파트너에게 코드를 전달하세요</p>
            <div style={{ background: ROSE_LT, borderRadius: 14, padding: "18px 24px", marginBottom: 14 }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: ROSE, letterSpacing: 5, fontFamily: "monospace" }}>{myCode}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(myCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              style={{ fontSize: 13, color: copied ? SAGE : ROSE, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {copied ? "✓ 복사됐어요" : "코드 복사"}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>파트너의 초대 코드를 입력하세요</p>
            <input placeholder="TASTE-XXXXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 18, fontWeight: 700, letterSpacing: 4, textAlign: "center", color: INK, fontFamily: "monospace", outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
            <button style={{ width: "100%", padding: 13, background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>커플 연동하기</button>
          </div>
        )}
        <button onClick={onClose} style={{ width: "100%", marginTop: 12, padding: "10px", background: "none", border: "none", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>닫기</button>
      </div>
    </div>
  );
}

/* ── 확인 팝업 (로그아웃 / 회원탈퇴) ── */
function ConfirmPopup({ emoji, title, desc, sub, confirmLabel, danger, onConfirm, onClose }: {
  emoji: string; title: string; desc: string; sub?: string;
  confirmLabel: string; danger?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Popup onClose={onClose}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{emoji}</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: danger ? "#EF4444" : INK, marginBottom: 8 }}>{title}</p>
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{desc}</p>
        {sub && <p style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{sub}</p>}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: 12, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
        <button onClick={onConfirm} style={{ flex: 1, padding: 12, background: danger ? "#EF4444" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{confirmLabel}</button>
      </div>
    </Popup>
  );
}

/* ══════════════════════════════════════
   메인 설정 페이지
══════════════════════════════════════ */
export default function SettingsPage() {
  const router  = useRouter();
  const { myName, partnerName, startDate, role, setMyName, setStartDate } = useAuthStore();
  const dday    = calcDDay(startDate);

  /* 팝업 상태 */
  const [modal, setModal] = useState<"name" | "date" | "invite" | "logout" | "withdraw" | null>(null);
  const close = () => setModal(null);

  /* 알림 설정 (로컬 스토리지) */
  const [notif, setNotif] = useState<NotificationSettings>({
    partnerRecord: true, wishlistAdd: true, anniversary: true,
  });
  const [notifPermission, setNotifPermission] = useState<"granted" | "denied" | "default" | "unsupported">("default");

  useEffect(() => {
    setNotif(loadNotifSettings());
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission as any);
    } else {
      setNotifPermission("unsupported");
    }
  }, []);

  const toggleNotif = async (key: keyof NotificationSettings) => {
    /* 처음 켤 때 권한 요청 */
    if (!notif[key] && notifPermission !== "granted") {
      const token = await requestNotificationPermission();
      if (token) setNotifPermission("granted");
    }
    const next = { ...notif, [key]: !notif[key] };
    setNotif(next);
    saveNotifSettings(next);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", maxWidth: 480, margin: "0 auto", fontFamily: "inherit", paddingBottom: 40 }}>

      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: MUTED, lineHeight: 1, padding: "0 4px 0 0" }}>‹</button>
        <p style={{ fontSize: 17, fontWeight: 700, color: INK }}>설정</p>
      </div>

      {/* 프로필 카드 */}
      <div style={{ margin: "16px 16px 0", background: "#fff", borderRadius: 20, padding: "20px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: ROSE, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 26, fontWeight: 800 }}>
              {myName[0]}
            </div>
            <div style={{ position: "absolute", bottom: -4, right: -8, width: 30, height: 30, borderRadius: "50%", background: SAGE, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
              {partnerName[0]}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <p style={{ fontSize: 19, fontWeight: 800, color: INK }}>{myName}</p>
              {role === "admin" && <div style={{ background: PURPLE, borderRadius: 20, padding: "2px 8px" }}><span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>관리자</span></div>}
            </div>
            <p style={{ fontSize: 13, color: MUTED }}>{myName} ❤️ {partnerName}</p>
            <div style={{ display: "inline-flex", alignItems: "center", background: ROSE_LT, borderRadius: 20, padding: "3px 10px", marginTop: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: ROSE, lineHeight: 1 }}>💑 D+{dday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 내 프로필 */}
      <SectionLabel title="내 프로필" />
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <Row icon="✏️" label="닉네임 변경" value={myName} onClick={() => setModal("name")} />
        <Row icon="🖼️" label="프로필 사진 변경" sub="Firebase Storage 연동 후 활성화" />
      </div>

      {/* 커플 정보 */}
      <SectionLabel title="커플 정보" />
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <Row icon="💑" label="교제 시작일" value={startDate} sub={`D+${dday}`} onClick={() => setModal("date")} />
        <Row icon="🔗" label="커플 연동 / 초대 코드" onClick={() => setModal("invite")} />
      </div>

      {/* 알림 설정 */}
      <SectionLabel title="알림 설정" />
      {notifPermission === "denied" && (
        <div style={{ margin: "0 16px 8px", background: "#FFF0F0", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "10px 14px" }}>
          <p style={{ fontSize: 12, color: "#EF4444" }}>⚠️ 알림 권한이 거부됐습니다. 기기 설정에서 알림을 허용해주세요.</p>
        </div>
      )}
      {notifPermission === "unsupported" && (
        <div style={{ margin: "0 16px 8px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "10px 14px" }}>
          <p style={{ fontSize: 12, color: MUTED }}>이 브라우저는 푸시 알림을 지원하지 않습니다.</p>
        </div>
      )}
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <Row
          icon="📸" label="파트너 새 기록 알림"
          sub="파트너가 맛집을 기록하면 알려드려요"
          rightEl={<Toggle on={notif.partnerRecord} onToggle={() => toggleNotif("partnerRecord")} />}
        />
        <Row
          icon="⭐" label="위시리스트 추가 알림"
          sub="파트너가 가고 싶은 곳을 추가하면 알려드려요"
          rightEl={<Toggle on={notif.wishlistAdd} onToggle={() => toggleNotif("wishlistAdd")} />}
        />
        <Row
          icon="🎂" label="기념일 알림"
          sub="교제 100일, 200일, 1주년... 챙겨드려요"
          rightEl={<Toggle on={notif.anniversary} onToggle={() => toggleNotif("anniversary")} />}
        />
      </div>

      {/* 앱 정보 */}
      <SectionLabel title="앱 정보" />
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <Row icon="ℹ️" label="앱 버전" value={`v${APP_VERSION}`} />
        <Row icon="📄" label="개인정보 처리방침"        onClick={() => router.push("/settings/privacy")} />
        <Row icon="📋" label="서비스 이용약관"           onClick={() => router.push("/settings/terms")} />
        <Row icon="📍" label="위치기반 서비스 이용약관"  onClick={() => router.push("/settings/location-terms")} />
        <Row icon="💬" label="고객센터 / 문의하기"       onClick={() => router.push("/settings/support")} />
      </div>

      {/* 관리자 메뉴 */}
      {role === "admin" && (
        <>
          <SectionLabel title="관리자" />
          <div style={{ borderTop: `1px solid ${BORDER}` }}>
            <Row icon="🛡️" label="관리자 페이지" sub="신고 처리 · 게시물 관리"
              onClick={() => router.push("/admin")}
              rightEl={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ background: ROSE_LT, borderRadius: 20, padding: "2px 8px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: ROSE }}>ADMIN</span>
                  </div>
                  <span style={{ fontSize: 18, color: "#C0B8B0" }}>›</span>
                </div>
              }
            />
          </div>
        </>
      )}

      {/* 계정 */}
      <SectionLabel title="계정" />
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <Row icon="🚪" label="로그아웃"  onClick={() => setModal("logout")}   danger />
        <Row icon="⚠️" label="회원 탈퇴" onClick={() => setModal("withdraw")} danger />
      </div>

      {/* 팝업 */}
      {modal === "name"    && <EditNamePopup  current={myName}    onSave={(v) => setMyName(v)}    onClose={close} />}
      {modal === "date"    && <EditDatePopup  current={startDate} onSave={(v) => setStartDate(v)} onClose={close} />}
      {modal === "invite"  && <InvitePopup onClose={close} />}
      {modal === "logout"  && (
        <ConfirmPopup emoji="👋" title="로그아웃 하시겠어요?" desc="다시 로그인하면 기록이 그대로 있어요." confirmLabel="로그아웃"
          onConfirm={() => { close(); router.push("/login"); }} onClose={close} />
      )}
      {modal === "withdraw" && (
        <ConfirmPopup emoji="⚠️" title="정말 탈퇴하시겠어요?" desc="탈퇴하면 모든 기록이 삭제되며 복구할 수 없습니다." sub="커플 기록도 함께 삭제됩니다." confirmLabel="탈퇴하기" danger
          onConfirm={() => { close(); router.push("/login"); }} onClose={close} />
      )}
    </div>
  );
}
