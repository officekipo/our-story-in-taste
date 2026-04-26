// ============================================================
//  Header.tsx  적용 경로: src/components/layout/Header.tsx
//
//  수정사항:
//    🔴 좌측 로고: 포크+하트+지도핀 SVG 심볼
//    🟠 설정 버튼: gear 아이콘
//    🔵 검색창 날짜 필터: CalendarPicker → DateRangePicker 로 변경
//         (CalendarPicker는 AddEditModal 단일 날짜용으로 복원)
// ============================================================
"use client";

import { useState }       from "react";
import { useRouter }      from "next/navigation";
import { useAuthStore }   from "@/store/authStore";
import { useStatsStore }  from "@/store/statsStore";
import { calcDDay }       from "@/lib/utils/date";
import { SIDO, CUISINES, SORT } from "@/types";
import { DateRangePicker } from "@/components/visited/DateRangePicker"; // 🔵 기간 선택
import type { TabId }     from "./BottomNav";

const ROSE  = "#C96B52";
const INK   = "#1A1412";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";

interface HeaderProps {
  activeTab:           TabId;
  visitedCount?:       number;
  avgRating?:          string | number;
  wishCount?:          number;
  viewMode?:           "list" | "gallery";
  onViewMode?:         (v: "list" | "gallery") => void;
  filterSido?:         string;
  filterCui?:          string;
  sortBy?:             string;
  timeline?:           boolean;
  showSearch?:         boolean;
  searchText?:         string;
  filterDateFrom?:     string;
  filterDateTo?:       string;
  onFilterSido?:       (v: string) => void;
  onFilterCui?:        (v: string) => void;
  onSort?:             (v: string) => void;
  onTimeline?:         () => void;
  onToggleSearch?:     () => void;
  onSearchText?:       (v: string) => void;
  onFilterDateRange?:  (from: string, to: string) => void;
}

export function Header({
  activeTab,
  visitedCount = 0, avgRating = "—", wishCount = 0,
  viewMode, onViewMode,
  filterSido = "", filterCui = "", sortBy = "date",
  timeline = false, showSearch = false, searchText = "",
  filterDateFrom = "", filterDateTo = "",
  onFilterSido, onFilterCui, onSort, onTimeline,
  onToggleSearch, onSearchText, onFilterDateRange,
}: HeaderProps) {
  const router = useRouter();
  const { myName, partnerName, startDate } = useAuthStore();
  const [showCalendar, setShowCalendar] = useState(false);

  const stats         = useStatsStore();
  const _visitedCount = stats.visitedCount || visitedCount;
  const _avgRating    = stats.avgRating    || avgRating;
  const _wishCount    = stats.wishCount !== 0 ? stats.wishCount : wishCount;

  const dday      = calcDDay(startDate || "2023-01-01");
  const isVisited = activeTab === "visited";
  const hasDateFilter = !!(filterDateFrom || filterDateTo);

  const dateChipText = filterDateFrom && filterDateTo
    ? `${filterDateFrom}  ~  ${filterDateTo}`
    : filterDateFrom
      ? `${filterDateFrom} 이후`
      : filterDateTo
        ? `${filterDateTo} 이전`
        : "";

  const chipBase: React.CSSProperties = {
    padding: "6px 12px", borderRadius: 20, fontSize: 12,
    cursor: "pointer", border: "none", fontFamily: "inherit",
    whiteSpace: "nowrap", flexShrink: 0,
  };
  const chipActive:   React.CSSProperties = { ...chipBase, background: ROSE,  color: "#fff",  outline: `1.5px solid ${ROSE}` };
  const chipInactive: React.CSSProperties = { ...chipBase, background: "#fff", color: MUTED,  outline: `1px solid ${BORDER}` };

  return (
    <header style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0 16px", position: "sticky", top: 0, zIndex: 20, flexShrink: 0 }}>

      {/* ── 1행 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, paddingBottom: 10 }}>

        {/* 🔴 서비스 심볼 SVG + 앱명 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, flexShrink: 0, filter: "drop-shadow(0 2px 6px rgba(201,107,82,0.35))" }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <p style={{ fontSize: 7.5, fontWeight: 700, color: "#D4956A", letterSpacing: 2.2, textTransform: "uppercase", lineHeight: 1, marginBottom: 3 }}>OUR STORY IN TASTE</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: INK, letterSpacing: -0.5, lineHeight: 1 }}>우리의 맛지도</p>
          </div>
        </div>

        {/* 통계 칩들 + 🟠 gear 설정 버튼 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", background: "#FAF7F3", borderRadius: 20, border: `1px solid ${BORDER}`, padding: "5px 10px", gap: 10 }}>
            {[
              { v: _visitedCount, l: "방문" },
              { v: _avgRating,    l: "평균" },
              { v: _wishCount,    l: "위시" },
            ].map(({ v, l }) => (
              <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: INK, lineHeight: 1 }}>{v}</span>
                <span style={{ fontSize: 8, color: MUTED, marginTop: 1, lineHeight: 1 }}>{l}</span>
              </div>
            ))}
          </div>
          {/* 🟠 gear 아이콘 설정 버튼 */}
          <button
            onClick={() => router.push("/settings")}
            aria-label="설정"
            style={{ width: 36, height: 36, borderRadius: "50%", background: ROSE, border: "2.5px solid #F2D5CC", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, boxShadow: "0 2px 8px rgba(201,107,82,0.3)" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.95)" strokeWidth="2"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="rgba(255,255,255,0.95)" strokeWidth="2" fill="none"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── 2행 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: isVisited ? 10 : 12, borderBottom: isVisited ? `1px solid ${BORDER}` : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{myName || ""}</span>
          <span style={{ fontSize: 12 }}>❤️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{partnerName || ""}</span>
          <div style={{ marginLeft: 4, background: "#F2D5CC", borderRadius: 20, padding: "3px 9px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: ROSE }}>💑 D+{dday}</span>
          </div>
        </div>

        {isVisited && viewMode && onViewMode && (
          <div style={{ display: "flex", background: "#F5F0EB", borderRadius: 10, padding: 3, border: `1px solid ${BORDER}`, gap: 2 }}>
            {(["list", "gallery"] as const).map((v) => {
              const active = viewMode === v;
              return (
                <button key={v} onClick={() => onViewMode(v)}
                  style={{ width: 32, height: 26, borderRadius: 7, border: "none", background: active ? "#fff" : "transparent", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.1)" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
      </div>

      {/* ── 필터 바 ── */}
      {isVisited && (
        <div>
          <div style={{ display: "flex", gap: 7, padding: "10px 3px", overflowX: "auto", alignItems: "center", scrollbarWidth: "none" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <select value={filterSido} onChange={e => onFilterSido?.(e.target.value)} style={{ ...filterSido ? chipActive : chipInactive, paddingRight: 24 }}>
                <option value="">지역 전체</option>
                {SIDO.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: filterSido ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
            </div>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <select value={filterCui} onChange={e => onFilterCui?.(e.target.value)} style={{ ...filterCui ? chipActive : chipInactive, paddingRight: 24 }}>
                <option value="">음식 전체</option>
                {CUISINES.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: filterCui ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
            </div>
            {(SORT as readonly any[]).map((o: any) => (
              <button key={o.v} onClick={() => onSort?.(o.v)} style={sortBy === o.v ? chipActive : chipInactive}>{o.l}</button>
            ))}
            <button onClick={onTimeline} style={timeline ? chipActive : chipInactive}>📅 타임라인</button>
            <button
              onClick={onToggleSearch}
              style={{ ...(showSearch ? { ...chipActive, background: "#F2D5CC", color: ROSE, outline: `1px solid ${ROSE}` } : chipInactive), marginLeft: "auto" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
                <circle cx="11" cy="11" r="7" stroke={showSearch ? ROSE : MUTED} strokeWidth="2" />
                <path d="M16.5 16.5L21 21" stroke={showSearch ? ROSE : MUTED} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* 🔵 검색창 + 달력(기간) 버튼 */}
          {showSearch && (
            <div style={{ paddingBottom: 10, position: "relative" }}>
              <div style={{ position: "relative" }}>
                <input
                  value={searchText}
                  onChange={e => onSearchText?.(e.target.value)}
                  placeholder="식당, 지역, 추억 검색..."
                  autoFocus
                  style={{
                    width: "100%", padding: "10px 44px 10px 14px",
                    background: "#FAFAFA", border: `1.5px solid ${BORDER}`,
                    borderRadius: 10, color: INK, fontSize: 13,
                    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                  }}
                />
                {/* 🔵 날짜 기간 선택 버튼 */}
                <button
                  onClick={() => setShowCalendar(v => !v)}
                  aria-label="날짜 기간 검색"
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: hasDateFilter || showCalendar ? "#F2D5CC" : "none",
                    border: "none", cursor: "pointer", padding: 4,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 6, transition: "background 0.15s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="17" rx="2.5" stroke={hasDateFilter || showCalendar ? ROSE : MUTED} strokeWidth="2"/>
                    <path d="M3 9h18" stroke={hasDateFilter || showCalendar ? ROSE : MUTED} strokeWidth="2"/>
                    <path d="M8 2v4M16 2v4" stroke={hasDateFilter || showCalendar ? ROSE : MUTED} strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="8"  cy="14" r="1.2" fill={hasDateFilter || showCalendar ? ROSE : MUTED}/>
                    <circle cx="12" cy="14" r="1.2" fill={hasDateFilter || showCalendar ? ROSE : MUTED}/>
                    <circle cx="16" cy="14" r="1.2" fill={hasDateFilter || showCalendar ? ROSE : MUTED}/>
                    <circle cx="8"  cy="18" r="1.2" fill={hasDateFilter || showCalendar ? ROSE : MUTED}/>
                    <circle cx="12" cy="18" r="1.2" fill={hasDateFilter || showCalendar ? ROSE : MUTED}/>
                  </svg>
                </button>
              </div>

              {/* 선택된 기간 칩 */}
              {hasDateFilter && dateChipText && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7 }}>
                  <span style={{ fontSize: 11, color: MUTED }}>기간 필터</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F2D5CC", borderRadius: 20, padding: "3px 8px 3px 10px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: ROSE }}>{dateChipText}</span>
                    <button
                      onClick={() => onFilterDateRange?.("", "")}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: ROSE, fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center" }}
                      aria-label="기간 필터 해제"
                    >×</button>
                  </div>
                </div>
              )}

              {/* 🔵 DateRangePicker 드롭다운 */}
              {showCalendar && (
                <>
                  <div onClick={() => setShowCalendar(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 99 }}>
                    <DateRangePicker
                      valueFrom={filterDateFrom}
                      valueTo={filterDateTo}
                      onChange={(from, to) => {
                        onFilterDateRange?.(from, to);
                        setShowCalendar(false);
                      }}
                      onClose={() => setShowCalendar(false)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
