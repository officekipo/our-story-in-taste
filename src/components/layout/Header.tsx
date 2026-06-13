// src/components/layout/Header.tsx
//
// 변경사항:
//   ★ 헤더 우측에 벨 아이콘 추가 (설정 버튼 왼쪽)
//   ★ unreadCount > 0 이면 빨간 dot 뱃지 표시
//   ★ onBell prop으로 NotificationDrawer 열기 연결
"use client";

import { useRouter }     from "next/navigation";
import { useAuthStore }  from "@/store/authStore";
import { useStatsStore } from "@/store/statsStore";
import { calcDDay }      from "@/lib/utils/date";
import type { TabId }    from "./BottomNav";

const ROSE   = "#C96B52";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";

function tn(name: string, max = 8): string {
  return name.length > max ? name.slice(0, max) + "…" : name;
}

interface HeaderProps {
  activeTab:       TabId;
  scrolled?:       boolean;
  visitedCount?:   number;
  avgRating?:      string | number;
  wishCount?:      number;
  viewMode?:       "list" | "gallery";
  onViewMode?:     (v: "list" | "gallery") => void;
  showSearch?:     boolean;
  onToggleSearch?: () => void;
  /* ── 알림 센터 ── */
  unreadCount?:    number;
  onBell?:         () => void;
}

export function Header({
  activeTab,
  scrolled     = false,
  visitedCount = 0,
  avgRating    = "—",
  wishCount    = 0,
  viewMode,
  onViewMode,
  showSearch   = false,
  onToggleSearch,
  unreadCount  = 0,
  onBell,
}: HeaderProps) {
  const router = useRouter();
  const { myName, partnerName, startDate } = useAuthStore();

  const stats         = useStatsStore();
  const _visitedCount = stats.visitedCount || visitedCount;
  const _avgRating    = stats.avgRating    || avgRating;
  const _wishCount    = stats.wishCount !== 0 ? stats.wishCount : wishCount;

  const dday      = calcDDay(startDate || "2023-01-01");
  const isVisited = activeTab === "visited";

  return (
    <header style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0 16px", position: "sticky", top: 0, zIndex: 20, flexShrink: 0 }}>

      {/* ── 1행: 로고 + 통계 + 벨 + 설정 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingBottom: 7 }}>

        <div onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{ width: 32, height: 32, flexShrink: 0, filter: "drop-shadow(0 2px 6px rgba(201,107,82,0.35))" }}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="11" fill="#C96B52"/>
              <rect x="9.5"  y="8.5" width="2" height="6.5" rx="1" fill="white"/>
              <rect x="13"   y="8.5" width="2" height="6.5" rx="1" fill="white"/>
              <rect x="16.5" y="8.5" width="2" height="6.5" rx="1" fill="white"/>
              <rect x="9.5"  y="15" width="9" height="1.8" rx="0.9" fill="white"/>
              <rect x="13"   y="16.5" width="2" height="14" rx="1" fill="white"/>
              <path d="M27.5 20.5C27.5 20.5 22 16.5 22 13.2C22 11.3 23.6 10 25.4 10C26.5 10 27.5 10.9 27.5 10.9C27.5 10.9 28.5 10 29.6 10C31.4 10 33 11.3 33 13.2C33 16.5 27.5 20.5 27.5 20.5Z" fill="white"/>
              <circle cx="27.5" cy="29" r="2.5" fill="rgba(255,255,255,0.75)"/>
              <path d="M25.2 29Q27.5 32 29.8 29" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 7, fontWeight: 700, color: "#D4956A", letterSpacing: 2.2, textTransform: "uppercase", lineHeight: 1, marginBottom: 2 }}>OUR STORY IN TASTE</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: INK, letterSpacing: -0.5, lineHeight: 1 }}>우리의 맛지도</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {/* 통계 칩 */}
          <div style={{ display: "flex", alignItems: "center", background: "#FAF7F3", borderRadius: 20, border: `1px solid ${BORDER}`, padding: "4px 9px", gap: 9 }}>
            {[
              { v: _visitedCount, l: "방문" },
              { v: _avgRating,    l: "평균" },
              { v: _wishCount,    l: "위시" },
            ].map(({ v, l }) => (
              <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: INK, lineHeight: 1 }}>{v}</span>
                <span style={{ fontSize: 8, color: MUTED, marginTop: 1, lineHeight: 1 }}>{l}</span>
              </div>
            ))}
          </div>

          {/* ── 벨 아이콘 ── */}
          <button
            onClick={onBell}
            className="tap"
            aria-label="알림"
            style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", background: "#FAF7F3", border: `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={unreadCount > 0 ? ROSE : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={unreadCount > 0 ? ROSE : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {/* 읽지 않은 알림 dot 뱃지 */}
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: ROSE, border: "1.5px solid #fff", display: "block" }} />
            )}
          </button>

          {/* 설정 버튼 */}
          <button onClick={() => router.push("/settings")} className="tap" style={{ width: 36, height: 36, borderRadius: "50%", background: ROSE, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="#fff" strokeWidth="2"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="#fff" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── 2행: 닉네임 + D-day + 뷰 토글 + 플로팅 돋보기 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 9 }}>

        {/* 좌측: 닉네임 + D-day */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, height: 30, minWidth: 0, flex: 1, marginRight: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: INK, flexShrink: 0, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tn(myName || "")}</span>
          <span style={{ fontSize: 11, flexShrink: 0 }}>❤️</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: INK, flexShrink: 0, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{partnerName ? tn(partnerName) : ""}</span>
          {startDate && (
            <div style={{ marginLeft: 4, background: "#F2D5CC", borderRadius: 20, padding: "0px 8px 2px", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: ROSE }}>💑 D+{dday}</span>
            </div>
          )}
        </div>

        {/* 우측: 뷰 토글 + 플로팅 돋보기 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>

          {/* 뷰 토글 — 다녀온 곳 탭 */}
          {isVisited && viewMode && onViewMode && (
            <div style={{ display: "flex", background: "#F5F0EB", borderRadius: 10, padding: "3px 3px 2px", border: `1px solid ${BORDER}`, gap: 2 }}>
              {(["list", "gallery"] as const).map((v) => {
                const active = viewMode === v;
                return (
                  <button key={v} onClick={() => onViewMode(v)} className="tap" style={{ width: 28, height: 24, borderRadius: 7, border: "none", background: active ? "#fff" : "transparent", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.1)" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {v === "list" ? (
                      <svg width="13" height="11" viewBox="0 0 14 12" fill="none">
                        <rect x="0" y="0"  width="14" height="2" rx="1" fill={active ? ROSE : "#C0B8B0"} />
                        <rect x="0" y="5"  width="14" height="2" rx="1" fill={active ? ROSE : "#C0B8B0"} />
                        <rect x="0" y="10" width="14" height="2" rx="1" fill={active ? ROSE : "#C0B8B0"} />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <rect x="0" y="0" width="6" height="6" rx="1.5" fill={active ? ROSE : "#C0B8B0"} />
                        <rect x="8" y="0" width="6" height="6" rx="1.5" fill={active ? ROSE : "#C0B8B0"} />
                        <rect x="0" y="8" width="6" height="6" rx="1.5" fill={active ? ROSE : "#C0B8B0"} />
                        <rect x="8" y="8" width="6" height="6" rx="1.5" fill={active ? ROSE : "#C0B8B0"} />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 플로팅 돋보기 — 다녀온 곳 + 스크롤 내렸을 때만 페이드인 */}
          {isVisited && scrolled && (
            <button
              onClick={onToggleSearch}
              className="tap"
              aria-label="검색 및 필터 열기"
              style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${showSearch ? ROSE : BORDER}`, background: showSearch ? "#F2D5CC" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.10)", transition: "background 0.18s, border-color 0.18s" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke={showSearch ? ROSE : MUTED} strokeWidth="2.2" />
                <path d="M16.5 16.5L21 21" stroke={showSearch ? ROSE : MUTED} strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
