// ============================================================
//  Header.tsx  적용 경로: src/components/layout/Header.tsx
// ============================================================
"use client";

import { useRouter }     from "next/navigation";
import { useAuthStore }  from "@/store/authStore";
import { useStatsStore } from "@/store/statsStore";
import { calcDDay }      from "@/lib/utils/date";
import { SIDO, CUISINES, SORT } from "@/types";
import type { TabId }    from "./BottomNav";

const ROSE  = "#C96B52";
const INK   = "#1A1412";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";

interface HeaderProps {
  activeTab:       TabId;
  visitedCount?:   number;
  avgRating?:      string | number;
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
  const { myName, partnerName, startDate, profileImgUrl } = useAuthStore();

  const stats         = useStatsStore();
  const _visitedCount = stats.visitedCount || visitedCount;
  const _avgRating    = stats.avgRating    || avgRating;
  const _wishCount    = stats.wishCount !== 0 ? stats.wishCount : wishCount;

  const dday      = calcDDay(startDate || "2023-01-01");
  const isVisited = activeTab === "visited";

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

        {/* 좌측: 커플 아바타 + 앱명 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: ROSE, border: "2.5px solid #F2D5CC", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>
              {profileImgUrl
                ? <img src={profileImgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (myName || "?")[0]}
            </div>
            <div style={{ position: "absolute", bottom: -2, right: -6, width: 22, height: 22, borderRadius: "50%", background: "#6B9E7E", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 8 }}>
              {(partnerName || "?")[0]}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 7.5, fontWeight: 700, color: "#D4956A", letterSpacing: 2.2, textTransform: "uppercase", lineHeight: 1, marginBottom: 3 }}>OUR STORY IN TASTE</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: INK, letterSpacing: -0.5, lineHeight: 1 }}>우리의 맛지도</p>
          </div>
        </div>

        {/* 우측: 통계 칩들 + 설정 버튼 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* 통계 3개를 pill 형태로 묶음 */}
          <div style={{ display: "flex", alignItems: "center", background: "#FAF7F3", borderRadius: 20, border: `1px solid ${BORDER}`, padding: "5px 10px", gap: 10 }}>
            {[
              { v: _visitedCount, l: "방문" },
              { v: _avgRating,    l: "평균" },
              { v: _wishCount,    l: "위시" },
            ].map(({ v, l }, i) => (
              <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: INK, lineHeight: 1 }}>{v}</span>
                <span style={{ fontSize: 8, color: MUTED, marginTop: 1, lineHeight: 1 }}>{l}</span>
              </div>
            ))}
          </div>

          {/* ★ 설정 버튼 — 프로필 사진 or 이니셜 원형 */}
          <button
            onClick={() => router.push("/settings")}
            aria-label="설정"
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: ROSE, border: "2.5px solid #F2D5CC",
              overflow: "hidden", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", padding: 0,
              boxShadow: "0 2px 8px rgba(201,107,82,0.3)",
            }}
          >
            {profileImgUrl
              ? <img src={profileImgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.9)" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                </svg>
              )
            }
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
          <div style={{ display: "flex", gap: 7, padding: "10px 0", overflowX: "auto", alignItems: "center" }}>
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
            <button onClick={onToggleSearch} style={{ ...(showSearch ? { ...chipActive, background: "#F2D5CC", color: ROSE, outline: `1px solid ${ROSE}` } : chipInactive), marginLeft: "auto" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
                <circle cx="11" cy="11" r="7" stroke={showSearch ? ROSE : MUTED} strokeWidth="2" />
                <path d="M16.5 16.5L21 21" stroke={showSearch ? ROSE : MUTED} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {showSearch && (
            <div style={{ paddingBottom: 10 }}>
              <input value={searchText} onChange={e => onSearchText?.(e.target.value)} placeholder="식당, 지역, 추억 검색..." autoFocus
                style={{ width: "100%", padding: "10px 14px", background: "#FAFAFA", border: `1.5px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          )}
        </div>
      )}
    </header>
  );
}
