// src/components/settings/SettingsShared.tsx
// 설정 페이지 전체에서 공통으로 사용하는 컴포넌트

"use client";
import { useRouter } from "next/navigation";

export const SC = {
  bg:     "#F8F5F1",
  card:   "#FFFFFF",
  warm:   "#FAF7F3",
  cream:  "#F0EBE3",
  rose:   "#C96B52",
  roseLt: "#F2D5CC",
  roseDk: "#8C4A38",
  sage:   "#6B9E7E",
  sageLt: "#C8DED1",
  ink:    "#1E1612",
  gray:   "#8A8078",
  grayLt: "#E2DDD8",
  accent: "#D4956A",
  border: "#EBE5DF",
  red:    "#D94040",
  blue:   "#4A90C4",
};

// 페이지 헤더
export function PageHdr({ title, backPath, right }: { title: string; backPath?: string; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <div style={{ background: SC.card, borderBottom: `1px solid ${SC.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
      <button onClick={() => backPath ? router.push(backPath) : router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: SC.ink, lineHeight: 1, padding: "0 4px 0 0" }}>‹</button>
      <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: SC.ink }}>{title}</div>
      {right}
    </div>
  );
}

// 섹션 구분 + 흰 박스
export function Sec({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      {title && <div style={{ fontSize: 11, fontWeight: 700, color: SC.gray, letterSpacing: 1.5, textTransform: "uppercase", padding: "16px 20px 8px" }}>{title}</div>}
      <div style={{ background: SC.card, borderTop: `1px solid ${SC.border}`, borderBottom: `1px solid ${SC.border}` }}>{children}</div>
    </div>
  );
}

// 한 줄 메뉴 로우
export function Row({ icon, label, value, onClick, danger, last }: { icon?: string; label: string; value?: string; onClick?: () => void; danger?: boolean; last?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 20px", borderBottom: last ? "none" : `1px solid ${SC.border}`, cursor: onClick ? "pointer" : "default", background: SC.card, transition: "background 0.15s" }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.background = SC.warm; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = SC.card; }}
    >
      {icon && <span style={{ fontSize: 20, width: 24, textAlign: "center" }}>{icon}</span>}
      <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: danger ? SC.red : SC.ink }}>{label}</div>
      {value && <div style={{ fontSize: 13, color: SC.gray }}>{value}</div>}
      {onClick && <span style={{ fontSize: 18, color: SC.grayLt }}>›</span>}
    </div>
  );
}

// 토글 스위치
export function Toggle({ label, desc, val, onToggle }: { label: string; desc?: string; val: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${SC.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: SC.ink }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: SC.gray, marginTop: 2 }}>{desc}</div>}
      </div>
      <div onClick={onToggle} style={{ width: 48, height: 28, borderRadius: 14, background: val ? SC.rose : SC.grayLt, cursor: "pointer", transition: "background 0.2s", position: "relative", flexShrink: 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: val ? 22 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
      </div>
    </div>
  );
}

// 필드 인풋
export function Field({ label, type = "text", placeholder, value, onChange, error, hint, right }: {
  label?: string; type?: string; placeholder?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string; hint?: string; right?: React.ReactNode;
}) {
  const base: React.CSSProperties = { width: "100%", padding: "12px 16px", background: SC.warm, border: `1px solid ${error ? SC.red : SC.border}`, borderRadius: 12, color: SC.ink, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" };
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: SC.gray, marginBottom: 6 }}>{label}</div>}
      <div style={{ position: "relative" }}>
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{ ...base, paddingRight: right ? 48 : 16 }} />
        {right && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>{right}</div>}
      </div>
      {error && <div style={{ fontSize: 11, color: SC.red, marginTop: 4 }}>{error}</div>}
      {hint && <div style={{ fontSize: 11, color: SC.gray, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// 버튼
export function PBtn({ label, onClick, variant = "primary", disabled, icon }: {
  label: string; onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "sage" | "ghost";
  disabled?: boolean; icon?: string;
}) {
  const bg = { primary: disabled ? "#ccc" : SC.rose, secondary: SC.warm, danger: "#FFF0F0", sage: SC.sage, ghost: "transparent" };
  const cl = { primary: "#fff", secondary: SC.gray, danger: SC.red, sage: "#fff", ghost: SC.rose };
  const bd = { primary: "none", secondary: `1px solid ${SC.border}`, danger: `1px solid ${SC.red}30`, sage: "none", ghost: "none" };
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: disabled ? "default" : "pointer", fontFamily: "inherit", background: bg[variant], color: cl[variant], border: bd[variant], display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: disabled ? 0.6 : 1, transition: "opacity 0.2s" }}>
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}{label}
    </button>
  );
}

// 여백
export function Gap() { return <div style={{ height: 8, background: SC.bg }} />; }
