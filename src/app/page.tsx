// src/app/page.tsx
//
// 성능 개선 (무한 스크롤):
//   ★ useVisited 실시간 구독은 기존과 동일하게 유지 (전체 데이터 수신)
//   ★ 화면 렌더링은 PAGE_SIZE(10) 단위로 클라이언트 슬라이싱
//   ★ IntersectionObserver — sentinel이 뷰포트 진입 시 자동으로 다음 10개 렌더
//   ★ 필터/정렬/검색은 전체 데이터 기준 동작 (기존과 동일)
//   ★ 필터 변경 시 visibleCount 자동 리셋
//
// 기존 수정 내용 유지:
//   ★ 달력(DateRangePicker) createPortal 렌더 (overflow:hidden clip 방지)
"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal }                         from "react-dom";

import { AppShell }                     from "@/components/layout/AppShell";
import { VisitedCard }                  from "@/components/visited/VisitedCard";
import { GalleryGrid }                  from "@/components/visited/GalleryGrid";
import { AddEditModal }                 from "@/components/visited/AddEditModal";
import { DetailModal }                  from "@/components/visited/DetailModal";
import { Toast }                        from "@/components/common/Toast";
import { ConfirmDialog }                from "@/components/common/ConfirmDialog";
import { KakaoAdFitInFeed }             from "@/components/common/KakaoAdFitInFeed";
import { DateRangePicker }              from "@/components/visited/DateRangePicker";
import { InvitePopup }                  from "@/components/settings/InvitePopup";
import { useUIStore }                   from "@/store/uiStore";
import { useAuthStore }                 from "@/store/authStore";
import { SAMPLE_VISITED }               from "@/lib/sample-data";
import { useVisited }                   from "@/hooks/useVisited";
import { useWishlist }                  from "@/hooks/useWishlist";
import { SIDO, CUISINES, SORT }         from "@/types";
import type { VisitedRecord, VisitedFormData } from "@/types";

const DUMMY_MODE = false;
const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const PAGE_SIZE = 10;

const MID_AD_INDEX = (len: number) => Math.floor(len / 2);

/* ─────────────────────────────────────────────────────────
   온보딩 배너
───────────────────────────────────────────────────────── */
function OnboardingBanner({ variant, onCouple, onJoin, onDismiss }: {
  variant: "full" | "slim";
  onCouple:  () => void;
  onJoin:    () => void;
  onDismiss: () => void;
}) {
  if (variant === "full") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px 32px", textAlign: "center", animation: "fadeUp 0.3s ease both" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: ROSE_LT, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="4"  y="6"  width="3" height="10" rx="1.5" fill={ROSE} />
            <rect x="9"  y="6"  width="3" height="10" rx="1.5" fill={ROSE} />
            <rect x="14" y="6"  width="3" height="10" rx="1.5" fill={ROSE} />
            <rect x="4"  y="16" width="13" height="2.5" rx="1.25" fill={ROSE} />
            <rect x="9"  y="18" width="3"  height="12" rx="1.5"   fill={ROSE} />
            <path d="M27 21C27 21 22 17.5 22 14.5C22 12.8 23.4 12 24.8 12C25.8 12 26.7 12.8 27 12.8C27.3 12.8 28.2 12 29.2 12C30.6 12 32 12.8 32 14.5C32 17.5 27 21 27 21Z" fill={ROSE} />
          </svg>
        </div>
        <p style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>함께 기록을 시작해볼까요?</p>
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.8, marginBottom: 28 }}>파트너와 커플 연동을 하면<br />두 사람의 맛집 기록을 함께 볼 수 있어요.<br />혼자서 먼저 기록할 수 있어요 ✨</p>
        <button onClick={onCouple} className="tap" style={{ width: "100%", maxWidth: 320, padding: "15px 0", background: ROSE, border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span>💑</span> 커플 연동 코드 만들기</button>
        <button onClick={onJoin} className="tap" style={{ width: "100%", maxWidth: 320, padding: "14px 0", background: "#fff", border: `1.5px solid ${BORDER}`, borderRadius: 14, color: INK, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span>🔗</span> 파트너 코드 입력하기</button>
        <button onClick={onDismiss} style={{ background: "none", border: "none", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>혼자서 먼저 기록할게요</button>
      </div>
    );
  }
  return (
    <div style={{ background: WARM, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, animation: "fadeUp 0.3s ease both" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: ROSE_LT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>💑</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 2 }}>파트너와 함께 기록해보세요</p>
        <p style={{ fontSize: 11, color: MUTED }}>커플 연동 시 두 사람의 기록을 함께 볼 수 있어요</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <button onClick={onCouple} className="tap" style={{ padding: "7px 12px", background: ROSE, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>코드 만들기</button>
        <button onClick={onJoin} className="tap" style={{ padding: "6px 12px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>코드 입력하기</button>
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#C0B8B0", fontSize: 18, cursor: "pointer", lineHeight: 1, flexShrink: 0, padding: 0 }} aria-label="닫기">×</button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   필터 바 — AppShell filterBar slot으로 전달
   show=false 시 max-height:0 + opacity:0 으로 슬라이드 접힘
   ★ showCalendar / onCalendarToggle: HomePage에서 제어 (portal 렌더를 위해)
───────────────────────────────────────────────────────── */
const _chipBase: React.CSSProperties = { padding: "5px 11px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: "none", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 };

function FilterBar({ show, filterSido, filterCui, sortBy, timeline, showSearch, searchText, filterDateFrom, filterDateTo, showCalendar, onFilterSido, onFilterCui, onSort, onTimeline, onToggleSearch, onSearchText, onFilterDateRange, onCalendarToggle }: {
  show: boolean;
  filterSido: string; filterCui: string; sortBy: string; timeline: boolean;
  showSearch: boolean; searchText: string; filterDateFrom: string; filterDateTo: string;
  showCalendar: boolean;
  onFilterSido: (v: string) => void; onFilterCui: (v: string) => void; onSort: (v: string) => void;
  onTimeline: () => void; onToggleSearch: () => void; onSearchText: (v: string) => void;
  onFilterDateRange: (from: string, to: string) => void;
  onCalendarToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const hasDateFilter = !!(filterDateFrom || filterDateTo);
  const dateChipText = filterDateFrom && filterDateTo
    ? `${filterDateFrom}  ~  ${filterDateTo}`
    : filterDateFrom ? `${filterDateFrom} 이후`
    : filterDateTo   ? `${filterDateTo} 이전`
    : "";
  const chipActive:   React.CSSProperties = { ..._chipBase, background: ROSE,  color: "#fff",  outline: `1.5px solid ${ROSE}` };
  const chipInactive: React.CSSProperties = { ..._chipBase, background: "#fff", color: MUTED,  outline: `1px solid ${BORDER}` };

  return (
    <div style={{ background: "#fff", overflow: "hidden", maxHeight: show ? 300 : 0, opacity: show ? 1 : 0, transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease", borderBottom: show ? `1px solid ${BORDER}` : "none", padding: "0 16px" }}>

      {/* 필터 칩 행 */}
      <div style={{ display: "flex", gap: 7, padding: "8px 3px", overflowX: "auto", alignItems: "center", scrollbarWidth: "none" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <select value={filterSido} onChange={e => onFilterSido(e.target.value)} style={{ ...filterSido ? chipActive : chipInactive, paddingRight: 24 }}>
            <option value="">지역 전체</option>
            {SIDO.map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: filterSido ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
        </div>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <select value={filterCui} onChange={e => onFilterCui(e.target.value)} style={{ ...filterCui ? chipActive : chipInactive, paddingRight: 24 }}>
            <option value="">음식 전체</option>
            {CUISINES.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: filterCui ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
        </div>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <select value={sortBy} onChange={e => onSort(e.target.value)} style={{ ...(sortBy !== "date" ? chipActive : chipInactive), paddingRight: 24 }}>
            {(SORT as readonly any[]).map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: sortBy !== "date" ? "#fff" : MUTED, pointerEvents: "none" }}>▾</span>
        </div>
        <button onClick={onTimeline} className="tap" style={timeline ? chipActive : chipInactive}>📅 타임라인</button>
        <button onClick={onToggleSearch} className="tap" style={{ ...(showSearch ? { ..._chipBase, background: "#F2D5CC", color: ROSE, outline: `1px solid ${ROSE}` } : chipInactive), marginLeft: "auto" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
            <circle cx="11" cy="11" r="7" stroke={showSearch ? ROSE : MUTED} strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke={showSearch ? ROSE : MUTED} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* 검색창 */}
      {showSearch && (
        <div style={{ paddingBottom: 8, position: "relative" }}>
          <div style={{ position: "relative" }}>
            <input value={searchText} onChange={e => onSearchText(e.target.value)} placeholder="식당, 지역, 추억 검색..." autoFocus style={{ width: "100%", padding: "9px 44px 9px 14px", background: "#FAFAFA", border: `1.5px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            {/* ★ onClick: HomePage의 onCalendarToggle 호출 — e를 그대로 전달해 버튼 위치 계산 */}
            <button onClick={onCalendarToggle} aria-label="날짜 기간 검색" className="tap" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: hasDateFilter || showCalendar ? "#F2D5CC" : "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "background 0.15s" }}>
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
          {hasDateFilter && dateChipText && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7 }}>
              <span style={{ fontSize: 11, color: MUTED }}>기간 필터</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F2D5CC", borderRadius: 20, padding: "3px 8px 3px 10px" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: ROSE }}>{dateChipText}</span>
                <button onClick={() => onFilterDateRange("", "")} className="tap" style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: ROSE, fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center" }} aria-label="기간 필터 해제">×</button>
              </div>
            </div>
          )}
          {/* ★ DateRangePicker는 여기서 렌더하지 않음 — HomePage에서 createPortal로 렌더 */}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   홈 페이지
───────────────────────────────────────────────────────── */
export default function HomePage() {
  const [dummyRecords, setDummyRecords] = useState<VisitedRecord[]>(SAMPLE_VISITED);
  const firebase     = useVisited();
  const firebaseWish = useWishlist();

  const records = DUMMY_MODE ? dummyRecords : firebase.records;
  const loading = DUMMY_MODE ? false        : firebase.loading;

  const [viewMode,        setViewMode]        = useState<"list" | "gallery">("list");
  const [filterSido,      setFilterSido]      = useState("");
  const [filterCui,       setFilterCui]       = useState("");
  const [sortBy,          setSortBy]          = useState("date");
  const [timeline,        setTimeline]        = useState(false);
  const [showSearch,      setShowSearch]      = useState(false);
  const [searchText,      setSearchText]      = useState("");
  const [filterDateFrom,  setFilterDateFrom]  = useState("");
  const [filterDateTo,    setFilterDateTo]    = useState("");
  const [expandedMonths,  setExpandedMonths]  = useState<Set<string>>(new Set());
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [scrolled,        setScrolled]        = useState(false);

  // ★ 무한 스크롤: 현재 화면에 렌더할 개수
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // ★ 무한 스크롤 sentinel ref
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ★ showCalendar를 HomePage로 끌어올림 — portal 렌더를 위해
  const [showCalendar, setShowCalendar] = useState(false);
  // ★ 달력 팝업 위치 (달력 버튼의 getBoundingClientRect 기준)
  const [calPos, setCalPos] = useState<{ top: number; right: number } | null>(null);
  // ★ SSR hydration 완료 후에만 portal 사용 (document.body 접근 안전)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { toastMsg, clearToast, confirmTarget, closeConfirm, openAddModal, showToast } = useUIStore();
  const { myName, coupleId } = useAuthStore();

  const showOnboarding = !coupleId && !bannerDismissed;

  // ★ 달력 버튼 클릭 핸들러 — 버튼 rect 기준으로 팝업 위치 결정 후 토글
  const handleCalendarToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!showCalendar) {
      const rect = e.currentTarget.getBoundingClientRect();
      setCalPos({
        top:   rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setShowCalendar(v => !v);
  };

  const handleCalendarClose = () => setShowCalendar(false);

  const handleFilterDateRange = (from: string, to: string) => {
    setFilterDateFrom(from);
    setFilterDateTo(to);
  };

  const handleToggleSearch = () => {
    setShowSearch(s => !s);
    setShowCalendar(false);
    const main = document.querySelector<HTMLElement>("main");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 전체 필터/정렬 결과 (기존과 동일)
  const filtered = useMemo(() => records
    .filter(r =>
      (!filterSido     || r.sido    === filterSido) &&
      (!filterCui      || r.cuisine === filterCui)  &&
      (!filterDateFrom || r.date >= filterDateFrom)  &&
      (!filterDateTo   || r.date <= filterDateTo)    &&
      (!searchText     || [r.name, r.memo, r.sido, r.district].some(s => s?.includes(searchText)))
    )
    .sort((a, b) =>
      sortBy === "date"   ? new Date(b.date).getTime() - new Date(a.date).getTime() :
      sortBy === "rating" ? b.rating - a.rating :
      a.name.localeCompare(b.name)
    ), [records, filterSido, filterCui, filterDateFrom, filterDateTo, searchText, sortBy]);

  // ★ 필터 조건 변경 시 visibleCount 리셋
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterSido, filterCui, filterDateFrom, filterDateTo, searchText, sortBy, timeline]);

  // ★ 현재 화면에 보여줄 항목 (visibleCount만큼 슬라이싱)
  const visibleFiltered = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );
  const hasMoreVisible = visibleCount < filtered.length;

  // ★ IntersectionObserver — sentinel이 뷰포트에 들어오면 다음 PAGE_SIZE 렌더
  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreVisible) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreVisible, handleLoadMore]);

  const byMonth = useMemo(() => filtered.reduce((acc, r) => {
    const m = r.date.slice(0, 7);
    (acc[m] = acc[m] ?? []).push(r);
    return acc;
  }, {} as Record<string, VisitedRecord[]>), [filtered]);

  const sortedMonths = useMemo(() => Object.keys(byMonth).sort((a, b) => b.localeCompare(a)), [byMonth]);

  useEffect(() => {
    if (timeline && sortedMonths.length > 0) setExpandedMonths(new Set([sortedMonths[0]]));
  }, [timeline]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMonth = (m: string) => {
    setExpandedMonths(prev => { const next = new Set(prev); next.has(m) ? next.delete(m) : next.add(m); return next; });
  };

  const handleSave = async (data: VisitedFormData, imgUrls: string[]) => {
    const { editTarget } = useUIStore.getState();
    if (DUMMY_MODE) {
      if (editTarget?.id) {
        setDummyRecords(prev => prev.map(r => r.id === editTarget.id ? { ...r, ...data, imgUrls } : r));
      } else {
        setDummyRecords(prev => [{ ...data, imgUrls, id: Date.now().toString(), coupleId: coupleId ?? "sample-couple-001", authorUid: "uid-me", authorName: myName, visits: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]);
      }
    } else {
      if (editTarget?.id) { await firebase.update(editTarget.id, { ...data, imgUrls }); }
      else                { await firebase.add(data, imgUrls); }
    }
  };

  const handleAddVisit = async (existingId: string, entry: { date: string; rating: 1|2|3|4|5; memo: string; imgUrls: string[]; revisit: boolean | null }) => {
    if (DUMMY_MODE) {
      setDummyRecords(prev => prev.map(r => {
        if (r.id !== existingId) return r;
        return { ...r, visits: [...(r.visits ?? []), { ...entry, authorUid: "uid-me", authorName: myName, createdAt: new Date().toISOString() }], updatedAt: new Date().toISOString() };
      }));
    } else {
      await firebase.addVisit(existingId, entry);
    }
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    if (DUMMY_MODE) { setDummyRecords(prev => prev.filter(r => r.id !== confirmTarget.id)); }
    else {
      const target = records.find(r => r.id === confirmTarget.id);
      await firebase.remove(confirmTarget.id, target?.imgUrls ?? [], target?.visits ?? []);
    }
    closeConfirm();
    showToast("기록을 삭제했어요 🗑️");
  };

  const openInvitePopup = () => setShowInvitePopup(true);

  if (loading) return (
    <AppShell activeTab="visited">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #F2D5CC", borderTopColor: ROSE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppShell>
  );

  const emptyMsg = filterDateFrom || filterDateTo ? `${filterDateFrom || "시작"} ~ ${filterDateTo || "현재"} 기간에 기록이 없어요` : "기록이 없어요";
  const midAdIdx = MID_AD_INDEX(visibleFiltered.length);

  return (
    <>
      <AppShell
        activeTab="visited"
        fab={
          <button onClick={openAddModal} className="tap" style={{ position: "fixed", bottom: 76, right: 20, width: 52, height: 52, borderRadius: "50%", background: ROSE, border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(201,107,82,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
            <span className="tap" style={{ display: "inline-block", marginTop: -3, fontSize: 28, lineHeight: "47px" }}>+</span>
          </button>
        }
        filterBar={
          <FilterBar
            show={!scrolled}
            filterSido={filterSido}      filterCui={filterCui}          sortBy={sortBy}
            timeline={timeline}          showSearch={showSearch}         searchText={searchText}
            filterDateFrom={filterDateFrom}                              filterDateTo={filterDateTo}
            showCalendar={showCalendar}
            onFilterSido={setFilterSido}    onFilterCui={setFilterCui}     onSort={setSortBy}
            onTimeline={() => setTimeline(t => !t)}
            onToggleSearch={() => setShowSearch(s => !s)}
            onSearchText={setSearchText}
            onFilterDateRange={handleFilterDateRange}
            onCalendarToggle={handleCalendarToggle}
          />
        }
        onScrolledChange={setScrolled}
        headerProps={{
          viewMode,    onViewMode:     setViewMode,
          showSearch,  onToggleSearch: handleToggleSearch,
        }}
      >
        <div style={viewMode === "gallery" && !timeline ? {} : { padding: "12px 16px 0" }}>

          {/* ── 갤러리 모드 ── */}
          {viewMode === "gallery" && !timeline && (
            <>
              {showOnboarding && filtered.length > 0 && (
                <div style={{ padding: "12px 16px 0" }}>
                  <OnboardingBanner variant="slim" onCouple={openInvitePopup} onJoin={openInvitePopup} onDismiss={() => setBannerDismissed(true)} />
                </div>
              )}
              {/* 갤러리는 전체 filtered 전달 (이미지 그리드라 슬라이싱 효과 미미) */}
              <GalleryGrid items={filtered} />
            </>
          )}

          {/* ── 리스트 or 타임라인 ── */}
          {(viewMode === "list" || timeline) && (
            <div>
              {showOnboarding && filtered.length === 0 && !filterSido && !filterCui && !filterDateFrom && !filterDateTo && !searchText && (
                <OnboardingBanner variant="full" onCouple={openInvitePopup} onJoin={openInvitePopup} onDismiss={() => setBannerDismissed(true)} />
              )}

              {filtered.length > 0 && (
                <>
                  {showOnboarding && (
                    <OnboardingBanner variant="slim" onCouple={openInvitePopup} onJoin={openInvitePopup} onDismiss={() => setBannerDismissed(true)} />
                  )}

                  {timeline ? (
                    // ── 타임라인: 월 단위 접기/펼치기 (기존 동일, 전체 filtered 사용)
                    <>
                      <KakaoAdFitInFeed key="ad-timeline-top" />
                      {sortedMonths.map((m, monthIdx) => {
                        const isOpen = expandedMonths.has(m);
                        return (
                          <div key={m}>
                            <div onClick={() => toggleMonth(m)} style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4, paddingBottom: isOpen ? 12 : 4, cursor: "pointer", userSelect: "none", WebkitUserSelect: "none", marginBottom: isOpen ? 0 : 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#8C4A38", flexShrink: 0 }}>{m.replace("-", "년 ")}월</span>
                              <div style={{ flex: 1, height: 1, background: BORDER }} />
                              <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{byMonth[m].length}곳</span>
                              <div style={{ width: 18, height: 18, borderRadius: "50%", background: isOpen ? ROSE : "#F0EBE3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
                                <svg width="8" height="8" viewBox="0 0 10 6" fill="none" style={{ transform: isOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}>
                                  <path d="M1 5L5 1L9 5" stroke={isOpen ? "#fff" : MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            </div>
                            {isOpen && (viewMode === "gallery"
                              ? <div style={{ marginBottom: 8 }}><GalleryGrid items={byMonth[m]} /></div>
                              : <div style={{ marginBottom: 20 }}>{byMonth[m].map(r => <VisitedCard key={r.id} record={r} onDelete={() => {}} />)}</div>
                            )}
                            {monthIdx === 0 && sortedMonths.length > 1 && <KakaoAdFitInFeed key="ad-timeline-mid" />}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    // ── 리스트: ★ visibleFiltered 기준으로 렌더 (무한 스크롤)
                    <>
                      <KakaoAdFitInFeed key="ad-list-top" />
                      {visibleFiltered.map((r, idx) => (
                        <div key={r.id}>
                          <VisitedCard record={r} onDelete={() => {}} />
                          {idx === midAdIdx && idx < visibleFiltered.length - 1 && <KakaoAdFitInFeed key="ad-list-mid" />}
                        </div>
                      ))}

                      {/* ★ 무한 스크롤 sentinel */}
                      <div ref={sentinelRef} style={{ height: 1 }} />

                      {/* 마지막 도달 메시지 */}
                      {!hasMoreVisible && filtered.length > PAGE_SIZE && (
                        <p style={{ textAlign: "center", fontSize: 12, color: "#C0B8B0", padding: "16px 0 24px" }}>
                          모든 기록을 불러왔어요 🎉
                        </p>
                      )}
                    </>
                  )}
                </>
              )}

              {filtered.length === 0 && (filterSido || filterCui || filterDateFrom || filterDateTo || searchText) && (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#C0B8B0" }}>
                  <div style={{ fontSize: 44 }}>🔍</div>
                  <p style={{ marginTop: 10, fontSize: 14 }}>{emptyMsg}</p>
                </div>
              )}

              {filtered.length === 0 && coupleId && !filterSido && !filterCui && !filterDateFrom && !filterDateTo && !searchText && (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#C0B8B0" }}>
                  <div style={{ fontSize: 44 }}>🍽️</div>
                  <p style={{ marginTop: 10, fontSize: 14 }}>아직 기록이 없어요. 첫 맛집을 기록해보세요!</p>
                </div>
              )}
            </div>
          )}
        </div>

        <AddEditModal onSave={handleSave} onAddVisit={handleAddVisit} existingRecords={records} />
        <DetailModal />
        {toastMsg      && <Toast message={toastMsg} onClose={clearToast} />}
        {confirmTarget && <ConfirmDialog message={confirmTarget.msg} onConfirm={handleDelete} onCancel={closeConfirm} />}
        {showInvitePopup && <InvitePopup onClose={() => setShowInvitePopup(false)} />}
      </AppShell>

      {/* ★ DateRangePicker — createPortal로 document.body에 직접 렌더
           FilterBar의 overflow:hidden clip 영향을 완전히 벗어남
           calPos: 달력 버튼의 getBoundingClientRect 기준 위치 */}
      {mounted && showCalendar && calPos && createPortal(
        <>
          {/* 바깥 클릭 시 닫기 */}
          <div onClick={handleCalendarClose} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
          <div style={{ position: "fixed", top: calPos.top, right: calPos.right, zIndex: 999 }}>
            <DateRangePicker
              valueFrom={filterDateFrom}
              valueTo={filterDateTo}
              onChange={(from, to) => { handleFilterDateRange(from, to); handleCalendarClose(); }}
              onClose={handleCalendarClose}
            />
          </div>
        </>,
        document.body
      )}
    </>
  );
}
