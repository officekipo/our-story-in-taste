// src/app/page.tsx
//
// 변경사항:
//   ★ FilterBar 컴포넌트 분리 → AppShell의 filterBar slot으로 전달
//     → 헤더 높이에 영향 없음 → 탭 이동 시 덜컥임 완전 해결
//   ★ FilterBar max-height + opacity 슬라이드 애니메이션
//   ★ 플로팅 돋보기(handleToggleSearch) 클릭 시 main scrollTo(0,0)
//     → 스크롤 최상단 이동 → AppShell의 scrolled=false → 필터 바 자동 펼침
//   기존 유지:
//     handleDelete: closeConfirm() 후 showToast()
//     AddEditModal에 onAddVisit, existingRecords prop
//     커플 미연동 온보딩 배너
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter }                    from "next/navigation";
import { AppShell }                     from "@/components/layout/AppShell";
import { VisitedCard }                  from "@/components/visited/VisitedCard";
import { GalleryGrid }                  from "@/components/visited/GalleryGrid";
import { AddEditModal }                 from "@/components/visited/AddEditModal";
import { DetailModal }                  from "@/components/visited/DetailModal";
import { Toast }                        from "@/components/common/Toast";
import { ConfirmDialog }                from "@/components/common/ConfirmDialog";
import { KakaoAdFitInFeed }             from "@/components/common/KakaoAdFitInFeed";
import { DateRangePicker }              from "@/components/visited/DateRangePicker";
import { useUIStore }                   from "@/store/uiStore";
import { useAuthStore }                 from "@/store/authStore";
import { SAMPLE_VISITED }               from "@/lib/sample-data";
import { useVisited }                   from "@/hooks/useVisited";
import { SIDO, CUISINES, SORT }         from "@/types";
import type { VisitedRecord, VisitedFormData } from "@/types";

const DUMMY_MODE = false;
const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";

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
───────────────────────────────────────────────────────── */
const _chipBase: React.CSSProperties = { padding: "5px 11px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: "none", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 };

function FilterBar({ show, filterSido, filterCui, sortBy, timeline, showSearch, searchText, filterDateFrom, filterDateTo, onFilterSido, onFilterCui, onSort, onTimeline, onToggleSearch, onSearchText, onFilterDateRange }: {
  show: boolean;
  filterSido: string; filterCui: string; sortBy: string; timeline: boolean;
  showSearch: boolean; searchText: string; filterDateFrom: string; filterDateTo: string;
  onFilterSido: (v: string) => void; onFilterCui: (v: string) => void; onSort: (v: string) => void;
  onTimeline: () => void; onToggleSearch: () => void; onSearchText: (v: string) => void;
  onFilterDateRange: (from: string, to: string) => void;
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const hasDateFilter = !!(filterDateFrom || filterDateTo);
  const dateChipText = filterDateFrom && filterDateTo ? `${filterDateFrom}  ~  ${filterDateTo}` : filterDateFrom ? `${filterDateFrom} 이후` : filterDateTo ? `${filterDateTo} 이전` : "";
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
            <button onClick={() => setShowCalendar(v => !v)} aria-label="날짜 기간 검색" className="tap" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: hasDateFilter || showCalendar ? "#F2D5CC" : "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "background 0.15s" }}>
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
          {showCalendar && (
            <>
              <div onClick={() => setShowCalendar(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 99 }}>
                <DateRangePicker valueFrom={filterDateFrom} valueTo={filterDateTo} onChange={(from, to) => { onFilterDateRange(from, to); setShowCalendar(false); }} onClose={() => setShowCalendar(false)} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   홈 페이지
───────────────────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();

  const [dummyRecords, setDummyRecords] = useState<VisitedRecord[]>(SAMPLE_VISITED);
  const firebase = useVisited();

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

  // AppShell의 scrolled 상태와 연동된 필터 바 표시 여부
  // AppShell이 scrolled를 Header로만 전달하므로, page.tsx에서 별도로 추적
  const [scrolled, setScrolled] = useState(false);

  const { toastMsg, clearToast, confirmTarget, closeConfirm, openAddModal, showToast } = useUIStore();
  const { myName, coupleId } = useAuthStore();

  const showOnboarding = !coupleId && !bannerDismissed;

  // 플로팅 돋보기 클릭 핸들러
  // — 검색 토글 + main 스크롤 최상단 이동(→ AppShell scrolled=false → 필터 바 펼침)
  const handleToggleSearch = () => {
    setShowSearch(s => !s);
    const main = document.querySelector<HTMLElement>("main");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const handleFilterDateRange = (from: string, to: string) => { setFilterDateFrom(from); setFilterDateTo(to); };

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

  const goToCouple = (mode?: "create" | "join") => router.push(mode === "join" ? "/couple?mode=join" : "/couple");

  if (loading) return (
    <AppShell activeTab="visited">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #F2D5CC", borderTopColor: ROSE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppShell>
  );

  const emptyMsg = filterDateFrom || filterDateTo ? `${filterDateFrom || "시작"} ~ ${filterDateTo || "현재"} 기간에 기록이 없어요` : "기록이 없어요";
  const midAdIdx = MID_AD_INDEX(filtered.length);

  return (
    <AppShell
      activeTab="visited"
      fab={
        <button onClick={openAddModal} className="tap" style={{ position: "fixed", bottom: 76, right: 20, width: 52, height: 52, borderRadius: "50%", background: ROSE, border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(201,107,82,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
          <span className="tap" style={{ fontSize: 28, lineHeight: "47px" }}>+</span>
        </button>
      }
      /* ── 필터 바: Header 외부, AppShell의 Header-main 사이 slot ── */
      filterBar={
        <FilterBar
          show={!scrolled}
          filterSido={filterSido}     filterCui={filterCui}         sortBy={sortBy}
          timeline={timeline}         showSearch={showSearch}        searchText={searchText}
          filterDateFrom={filterDateFrom}                            filterDateTo={filterDateTo}
          onFilterSido={setFilterSido}   onFilterCui={setFilterCui}    onSort={setSortBy}
          onTimeline={() => setTimeline(t => !t)}
          onToggleSearch={() => setShowSearch(s => !s)}
          onSearchText={setSearchText}
          onFilterDateRange={handleFilterDateRange}
        />
      }
      /* ── scrolled 상태를 AppShell에서 받아와 filterBar show 제어 ── */
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
                <OnboardingBanner variant="slim" onCouple={() => goToCouple("create")} onJoin={() => goToCouple("join")} onDismiss={() => setBannerDismissed(true)} />
              </div>
            )}
            <GalleryGrid items={filtered} />
          </>
        )}

        {/* ── 리스트 or 타임라인 ── */}
        {(viewMode === "list" || timeline) && (
          <div>
            {showOnboarding && filtered.length === 0 && !filterSido && !filterCui && !filterDateFrom && !filterDateTo && !searchText && (
              <OnboardingBanner variant="full" onCouple={() => goToCouple("create")} onJoin={() => goToCouple("join")} onDismiss={() => setBannerDismissed(true)} />
            )}

            {filtered.length > 0 && (
              <>
                {showOnboarding && (
                  <OnboardingBanner variant="slim" onCouple={() => goToCouple("create")} onJoin={() => goToCouple("join")} onDismiss={() => setBannerDismissed(true)} />
                )}

                {timeline ? (
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
                  <>
                    <KakaoAdFitInFeed key="ad-list-top" />
                    {filtered.map((r, idx) => (
                      <div key={r.id}>
                        <VisitedCard record={r} onDelete={() => {}} />
                        {idx === midAdIdx && idx < filtered.length - 1 && <KakaoAdFitInFeed key="ad-list-mid" />}
                      </div>
                    ))}
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
    </AppShell>
  );
}
