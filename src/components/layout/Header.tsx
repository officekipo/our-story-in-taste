// src/components/layout/Header.tsx
// 변수명: useAuthStore에서 myName, partnerName, startDate, coupleId 사용
"use client";

import { useAuthStore } from "@/store/authStore";
import { calcDDay }     from "@/lib/utils/date";
import { SIDO, CUISINES, SORT } from "@/types";
import type { TabId }   from "./BottomNav";

const ROSE   = "#C96B52";
const MUTED  = "#8A8078";
const INK    = "#1A1412";
const BORDER = "#E2DDD8";

interface HeaderProps {
  activeTab:       TabId;
  visitedCount?:   number;
  avgRating?:      string;
  wishCount?:      number;
  viewMode?:       "list" | "gallery";
  onViewMode?:     (v: "list" | "gallery") => void;
  filterSido?:     string;
  filterCui?:      string;
  sortBy?:         string;
  timeline?:       boolean;
  showSearch?:     boolean;
  searchText?:     string;
  onFilterSido?:   (v: string) => void;
  onFilterCui?:    (v: string) => void;
  onSort?:         (v: string) => void;
  onTimeline?:     () => void;
  onToggleSearch?: () => void;
  onSearchText?:   (v: string) => void;
}

export function Header({
  activeTab,
  visitedCount = 0, avgRating = "—", wishCount = 0,
  viewMode, onViewMode,
  filterSido = "", filterCui = "", sortBy = "date",
  timeline = false, showSearch = false, searchText = "",
  onFilterSido, onFilterCui, onSort, onTimeline,
  onToggleSearch, onSearchText,
}: HeaderProps) {
  // ── authStore에서 flat하게 꺼냄 (변수명 기준 참고)
  const { myName, partnerName, startDate } = useAuthStore();
  const dday      = calcDDay(startDate);
  const isVisited = activeTab === "visited";

  const chipBase: React.CSSProperties = { padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: "none", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 };
  const chipActive:   React.CSSProperties = { ...chipBase, background: ROSE,  color: "#fff", border: `1px solid ${ROSE}` };
  const chipInactive: React.CSSProperties = { ...chipBase, background: "#fff", color: MUTED, border: `1px solid ${BORDER}` };

  return (
    <header style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0 20px", position: "sticky", top: 0, zIndex: 20 }}>

      {/* ── 1행: 프로필 + 앱 이름 + 통계 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 프로필 아이콘 (이니셜) */}
          <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: ROSE, border: "2px solid #F2D5CC", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>
              {myName[0]}
            </div>
            <div style={{ position: "absolute", bottom: -3, right: -8, width: 26, height: 26, borderRadius: "50%", background: "#6B9E7E", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 10 }}>
              {partnerName[0]}
            </div>
          </div>
          {/* 앱 이름 */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 600, color: "#D4956A", letterSpacing: 3, textTransform: "uppercase", lineHeight: 1 }}>OUR STORY IN TASTE</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: INK, letterSpacing: -0.5, lineHeight: 1.2 }}>우리의 맛지도</p>
          </div>
        </div>

        {/* 통계 3개 */}
        <div style={{ display: "flex", gap: 14 }}>
          {[{ v: visitedCount, l: "방문했어" }, { v: avgRating, l: "평균" }, { v: wishCount, l: "가고싶은곳" }].map(({ v, l }) => (
            <div key={l} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: INK, lineHeight: 1 }}>{v}</p>
              <p style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2행: 커플명 + D-Day + 뷰 토글 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: isVisited ? 10 : 14, borderBottom: isVisited ? `1px solid ${BORDER}` : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{myName}</span>
          <span style={{ fontSize: 13 }}>❤️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{partnerName}</span>
          {/* D+N 배지 */}
          <div style={{ marginLeft: 6, background: "#F2D5CC", borderRadius: 20, padding: "2px 8px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: ROSE }}>💑 D+{dday}</span>
          </div>
        </div>

        {/* 리스트 / 갤러리 토글 — visited 탭에서만 */}
        {isVisited && viewMode && onViewMode && (
          <div style={{ display: "flex", background: "#FAF7F3", borderRadius: 8, padding: 2, border: `1px solid ${BORDER}` }}>
            {(["list", "gallery"] as const).map((v) => (
              <button
                key={v}
                onClick={() => onViewMode(v)}
                style={{ width: 32, height: 28, borderRadius: 6, border: "none", background: viewMode === v ? "#fff" : "transparent", color: viewMode === v ? ROSE : "#C0B8B0", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
              >
                {v === "list" ? "☰" : "⊞"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 필터 바 — visited 탭에서만 ── */}
      {isVisited && (
        <div>
          <div style={{ display: "flex", gap: 8, padding: "10px 0", overflowX: "auto", alignItems: "center" }}>

            {/* 지역 셀렉트 */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <select value={filterSido} onChange={(e) => onFilterSido?.(e.target.value)} style={{ ...filterSido ? chipActive : chipInactive, paddingRight: 26 }}>
                <option value="">지역 전체</option>
                {SIDO.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: filterSido ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
            </div>

            {/* 음식 셀렉트 */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <select value={filterCui} onChange={(e) => onFilterCui?.(e.target.value)} style={{ ...filterCui ? chipActive : chipInactive, paddingRight: 26 }}>
                <option value="">음식 전체</option>
                {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: filterCui ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
            </div>

            {/* 정렬 */}
            {SORT.map((o) => (
              <button key={o.v} onClick={() => onSort?.(o.v)} style={sortBy === o.v ? chipActive : chipInactive}>{o.l}</button>
            ))}

            {/* 타임라인 */}
            <button onClick={onTimeline} style={timeline ? chipActive : chipInactive}>📅 타임라인</button>

            {/* 검색 토글 */}
            <button onClick={onToggleSearch} style={{ ...(showSearch ? { ...chipActive, background: "#F2D5CC", color: ROSE, border: `1px solid ${ROSE}` } : chipInactive), marginLeft: "auto" }}>🔍</button>
          </div>

          {/* 검색 인풋 */}
          {showSearch && (
            <div style={{ paddingBottom: 10 }}>
              <input
                value={searchText}
                onChange={(e) => onSearchText?.(e.target.value)}
                placeholder="식당, 지역, 추억 검색..."
                autoFocus
                style={{ width: "100%", padding: "11px 16px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          )}
        </div>
      )}
    </header>
  );
}
