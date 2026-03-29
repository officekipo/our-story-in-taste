"use client";
import { useAuthStore } from "@/store/authStore";
import { calcDDay } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { SIDO, CUISINES, SORT } from "@/types";
import type { TabId } from "./BottomNav";

interface HeaderProps {
  activeTab: TabId;
  /* 다녀온 곳 탭 전용 필터 props — 다른 탭에서는 전달 안 해도 됩니다 */
  visitedCount?: number;
  avgRating?: string;
  wishCount?: number;
  viewMode?: "list" | "gallery";
  onViewMode?: (v: "list" | "gallery") => void;
  filterSido?: string;
  filterCui?: string;
  sortBy?: string;
  timeline?: boolean;
  showSearch?: boolean;
  searchText?: string;
  onFilterSido?: (v: string) => void;
  onFilterCui?: (v: string) => void;
  onSort?: (v: string) => void;
  onTimeline?: () => void;
  onToggleSearch?: () => void;
  onSearchText?: (v: string) => void;
}
export function Header({
  activeTab,
  visitedCount = 0,
  avgRating = "—",
  wishCount = 0,
  viewMode,
  onViewMode,
  filterSido = "",
  filterCui = "",
  sortBy = "date",
  timeline = false,
  showSearch = false,
  searchText = "",
  onFilterSido,
  onFilterCui,
  onSort,
  onTimeline,
  onToggleSearch,
  onSearchText,
}: HeaderProps) {
  const { name, partnerName, dDayStart, avatarColor } = useAuthStore();
  const dday = calcDDay(dDayStart);
  const isVisited = activeTab === "visited";
  /* 칩 공통 스타일 */
  const chip =
    "px-3.5 py-1.5 rounded-full text-xs font-medium border shrink-0 cursor-pointer whitespace-nowrap";
  const activeChip = "bg-rose text-white border-rose";
  const inactiveChip = "bg-white text-muted border-muted-light";

  return (
    <header className="bg-white border-b border-muted-light px-5 sticky top-0 z-20">
      {/* ── 1행: 프로필 + 앱 이름 + 통계 ── */}
      <div className="flex items-center justify-between pt-3.5 pb-3">
        {/* 좌측: 프로필 사진 + 앱 이름 */}
        <div className="flex items-center gap-3">
          {/* 커플 프로필 아이콘 (Firebase Storage 연동 전까지 이니셜) */}
          <div className="relative w-11 h-11 shrink-0">
            {/* 내 프로필 */}
            <div
              className="w-11 h-11 rounded-full border-2 border-rose-light flex items-center justify-center font-bold text-white text-base"
              style={{ backgroundColor: `#${avatarColor || "FF8080"}` }}
            >
              {/* {name[0]} */}
              {name?.[0] || "노랑"}
            </div>
            {/* 파트너 프로필 (우하단 겹침) */}
            <div className="absolute -bottom-1 -right-2 w-7 h-7 rounded-full border-2 border-white bg-sage flex items-center justify-center font-bold text-white text-[10px]">
              {/* {partnerName[0]} */}
              {partnerName?.[0] || "병아리"}
            </div>
          </div>
          {/* 앱 이름 */}
          <div>
            <p className="text-[9px] font-semibold text-accent tracking-[3px] uppercase leading-none">
              OUR STORY IN TASTE
            </p>
            <p className="text-[20px] font-extrabold text-ink tracking-tight leading-tight">
              우리의 맛지도
            </p>
          </div>
        </div>

        {/* 우측: 통계 3개 숫자 */}
        <div className="flex gap-3.5 items-center">
          {[
            { v: visitedCount, l: "방문했어" },
            { v: avgRating, l: "평균" },
            { v: wishCount, l: "가고싶은곳" },
          ].map(({ v, l }) => (
            <div key={l} className="text-center">
              <p className="text-[17px] font-extrabold text-ink leadingnone">
                {v}
              </p>
              <p className="text-[9px] text-muted mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>
      {/* ── 2행: 커플 이름 + D-Day + 뷰 토글 ── */}
      <div
        className={cn(
          "flex items-center justify-between",
          isVisited ? "pb-2.5 border-b border-muted-light" : "pb-3.5",
        )}
      >
        {/* 커플 이름 + D-Day 배지 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-ink">{name}</span>
          <span className="text-[13px]">❤</span>
          <span className="text-[13px] font-semibold textink">
            {partnerName}
          </span>
          {/* D+N 배지 */}
          <div className="ml-1.5 bg-rose-light rounded-full px-2 py-0.5 flex items-center gap-1">
            <span className="text-[10px] font-bold text-rose"> D+{dday}</span>
          </div>
        </div>
        {/* 리스트/갤러리 토글 — 다녀온 곳 탭에서만 */}
        {isVisited && viewMode && onViewMode && (
          <div className="flex bg-warm rounded-lg p-0.5 border border-mutedlight">
            {(["list", "gallery"] as const).map((v) => (
              <button
                key={v}
                onClick={() => onViewMode(v)}
                className={cn(
                  "w-8 h-7 rounded-md text-sm font-bold transition-all",
                  viewMode === v
                    ? "bg-white text-rose shadow-sm"
                    : "bg-transparent text-muted-mid",
                )}
              >
                {v === "list" ? "☰" : "⊞"}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* ── 필터 바 — 다녀온 곳 탭에서만 ── */}
      {isVisited && (
        <div>
          <div className="flex gap-2 py-2.5 overflow-x-auto items-center">
            {/* 지역 셀렉트 */}
            <div className="relative shrink-0">
              <select
                value={filterSido}
                onChange={(e) => onFilterSido?.(e.target.value)}
                className={cn(
                  chip,
                  "pr-6",
                  filterSido ? activeChip : inactiveChip,
                )}
              >
                <option value="">지역 전체</option>
                {SIDO.map((s) => (
                  <option key={`sido-${s}`} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none",
                  filterSido ? "text-white" : "text-muted",
                )}
              >
                ▾
              </span>
            </div>
            {/* 음식 셀렉트 */}
            <div className="relative shrink-0">
              <select
                value={filterCui}
                onChange={(e) => onFilterCui?.(e.target.value)}
                className={cn(
                  chip,
                  "pr-6",
                  filterCui ? activeChip : inactiveChip,
                )}
              >
                <option value="">음식 전체</option>
                {CUISINES.map((c) => (
                  <option key={`cui-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none",
                  filterCui ? "text-white" : "text-muted",
                )}
              >
                ▾
              </span>
            </div>
            {/* 정렬 칩 */}
            {SORT.map((o) => (
              <button
                key={`sort-chip-${o.v}`}
                onClick={() => onSort?.(o.v)}
                className={cn(chip, sortBy === o.v ? activeChip : inactiveChip)}
              >
                {o.l}
              </button>
            ))}
            {/* 타임라인 */}
            <button
              onClick={onTimeline}
              className={cn(chip, timeline ? activeChip : inactiveChip)}
            >
              타임라인
            </button>
            {/* 검색 토글 */}
            <button
              key="search-toggle-btn"
              onClick={onToggleSearch}
              className={cn(
                chip,
                "ml-auto",
                showSearch
                  ? "bg-rose-light text-rose border-rose"
                  : inactiveChip,
              )}
            >
              🔍
            </button>
          </div>
          {/* 검색 인풋 — 버튼 클릭 시 표시 */}
          {showSearch && (
            <div className="pb-2.5">
              <input
                value={searchText}
                onChange={(e) => onSearchText?.(e.target.value)}
                placeholder="식당, 지역, 추억 검색..."
                autoFocus
                className="
                  w-full px-4 py-2.5
                  bg-white border border-muted-light rounded-xl
                  text-sm text-ink
                "
              />
            </div>
          )}
        </div>
      )}
    </header>
  );
}
