// src/components/layout/Header.tsx
"use client";

import { useRouter }   from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { calcDDay }    from "@/lib/utils/date";
import { SIDO, CUISINES, SORT } from "@/types";
import type { TabId }  from "./BottomNav";

const ROSE   = "#C96B52";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
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
  const router = useRouter();
  const { myName, partnerName, startDate } = useAuthStore();
  const dday      = calcDDay(startDate);
  const isVisited = activeTab === "visited";

  const chipBase: React.CSSProperties   = { padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: "none", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 };
  const chipActive: React.CSSProperties = { ...chipBase, background: ROSE,  color: "#fff", outline: `1.5px solid ${ROSE}` };
  const chipInactive: React.CSSProperties = { ...chipBase, background: "#fff", color: MUTED, outline: `1px solid ${BORDER}` };

  return (
    <header style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0 20px", position: "sticky", top: 0, zIndex: 20 }}>

      {/* ── 1행: 프로필 + 앱 이름 + 통계 + 사람 아이콘 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 13, paddingBottom: 11 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          {/* 커플 프로필 이니셜 아이콘 */}
          <div style={{ position: "relative", width: 42, height: 42, flexShrink: 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: ROSE, border: "2.5px solid #F2D5CC", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>
              {myName[0]}
            </div>
            {partnerName[0] && (
              <div style={{ position: "absolute", bottom: -2, right: -7, width: 24, height: 24, borderRadius: "50%", background: "#6B9E7E", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 9 }}>
                {partnerName[0]}
              </div>
            )}
          </div>

          {/* 앱 이름 */}
          <div>
            <p style={{ fontSize: 8, fontWeight: 700, color: "#D4956A", letterSpacing: 2.5, textTransform: "uppercase", lineHeight: 1, marginBottom: 3 }}>OUR STORY IN TASTE</p>
            <p style={{ fontSize: 19, fontWeight: 800, color: INK, letterSpacing: -0.5, lineHeight: 1 }}>우리의 맛지도</p>
          </div>
        </div>

        {/* 우측: 통계 + 사람 아이콘 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {[
            { v: visitedCount, l: "방문" },
            { v: avgRating,    l: "평균" },
            { v: wishCount,    l: "위시" },
          ].map(({ v, l }) => (
            <div key={l} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: INK, lineHeight: 1 }}>{v}</p>
              <p style={{ fontSize: 8, color: MUTED, marginTop: 2, lineHeight: 1 }}>{l}</p>
            </div>
          ))}

          {/* 설정 진입 — 사람 아이콘 버튼 */}
          <button
            onClick={() => router.push("/settings")}
            aria-label="설정"
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#F5F0EB", border: `1.5px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: 2 }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke={MUTED} strokeWidth="1.8" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 2행: 커플명 + D-Day + 리스트/갤러리 토글 ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingBottom: isVisited ? 10 : 13,
        borderBottom: isVisited ? `1px solid ${BORDER}` : "none",
      }}>
        {/* 커플명 + D-Day 배지 */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: INK, lineHeight: 1 }}>{myName}</span>
          {partnerName && (
            <>
              <span style={{ fontSize: 12, lineHeight: 1 }}>❤️</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: INK, lineHeight: 1 }}>{partnerName}</span>
            </>
          )}

          {/* D+N 배지 — lineHeight:1 + padding으로 세로 정렬 정확하게 */}
          <div style={{
            marginLeft: 4,
            background: "#F2D5CC",
            borderRadius: 20,
            padding: "3px 9px",
            display: "inline-flex",
            alignItems: "center",
            lineHeight: 1,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: ROSE, lineHeight: 1 }}>💑 D+{dday}</span>
          </div>
        </div>

        {/* 리스트 / 갤러리 토글 — visited 탭에서만 */}
        {isVisited && viewMode && onViewMode && (
          <div style={{ display: "flex", background: "#F5F0EB", borderRadius: 10, padding: 3, border: `1px solid ${BORDER}`, gap: 2 }}>
            {(["list", "gallery"] as const).map((v) => {
              const active = viewMode === v;
              return (
                <button
                  key={v}
                  onClick={() => onViewMode(v)}
                  style={{
                    width: 34, height: 28,
                    borderRadius: 7,
                    border: "none",
                    background: active ? "#fff" : "transparent",
                    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                    color: active ? ROSE : "#C0B8B0",
                    cursor: "pointer",
                    transition: "all 0.18s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {v === "list" ? (
                    /* 리스트 아이콘 — 줄 3개 SVG */
                    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                      <rect x="0" y="0"  width="14" height="2" rx="1" fill={active ? ROSE : "#C0B8B0"} />
                      <rect x="0" y="5"  width="14" height="2" rx="1" fill={active ? ROSE : "#C0B8B0"} />
                      <rect x="0" y="10" width="14" height="2" rx="1" fill={active ? ROSE : "#C0B8B0"} />
                    </svg>
                  ) : (
                    /* 갤러리 아이콘 — 2x2 그리드 SVG */
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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

      {/* ── 필터 바 — visited 탭에서만 ── */}
      {isVisited && (
        <div>
          <div style={{ display: "flex", gap: 7, padding: "10px 2px", overflowX: "auto", alignItems: "center" }}>

            <div style={{ position: "relative", flexShrink: 0 }}>
              <select value={filterSido} onChange={(e) => onFilterSido?.(e.target.value)} style={{ ...filterSido ? chipActive : chipInactive, paddingRight: 24 }}>
                <option value="">지역 전체</option>
                {SIDO.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: filterSido ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
            </div>

            <div style={{ position: "relative", flexShrink: 0 }}>
              <select value={filterCui} onChange={(e) => onFilterCui?.(e.target.value)} style={{ ...filterCui ? chipActive : chipInactive, paddingRight: 24 }}>
                <option value="">음식 전체</option>
                {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: filterCui ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
            </div>

            {SORT.map((o) => (
              <button key={o.v} onClick={() => onSort?.(o.v)} style={sortBy === o.v ? chipActive : chipInactive}>{o.l}</button>
            ))}

            <button onClick={onTimeline} style={timeline ? chipActive : chipInactive}>📅 타임라인</button>

            <button
              onClick={onToggleSearch}
              style={{ ...showSearch ? { ...chipActive, background: "#F2D5CC", color: ROSE, outline: `1px solid ${ROSE}` } : chipInactive, marginLeft: "auto" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
                <circle cx="11" cy="11" r="7" stroke={showSearch ? ROSE : MUTED} strokeWidth="2" />
                <path d="M16.5 16.5L21 21" stroke={showSearch ? ROSE : MUTED} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {showSearch && (
            <div style={{ paddingBottom: 10 }}>
              <input
                value={searchText}
                onChange={(e) => onSearchText?.(e.target.value)}
                placeholder="식당, 지역, 추억 검색..."
                autoFocus
                style={{ width: "100%", padding: "10px 14px", background: "#FAFAFA", border: `1.5px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          )}
        </div>
      )}
    </header>
  );
}
