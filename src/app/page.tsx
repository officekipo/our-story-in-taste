// src/app/page.tsx
//
//  수정사항:
//    ★ 인피드 광고 삽입
//      - 일반 리스트: 3개 게시글마다 광고 1개
//      - 타임라인:    월 섹션 사이마다 광고 1개
//      - 갤러리:      광고 없음 (그리드 레이아웃 유지)
"use client";

import { useState, useMemo, useEffect } from "react";
import { AppShell }              from "@/components/layout/AppShell";
import { VisitedCard }           from "@/components/visited/VisitedCard";
import { GalleryGrid }           from "@/components/visited/GalleryGrid";
import { AddEditModal }          from "@/components/visited/AddEditModal";
import { DetailModal }           from "@/components/visited/DetailModal";
import { Toast }                 from "@/components/common/Toast";
import { ConfirmDialog }         from "@/components/common/ConfirmDialog";
import { KakaoAdFitInFeed }      from "@/components/common/KakaoAdFitInFeed";
import { useUIStore }            from "@/store/uiStore";
import { useAuthStore }          from "@/store/authStore";
import { SAMPLE_VISITED }        from "@/lib/sample-data";
import { useVisited }            from "@/hooks/useVisited";
import type { VisitedRecord, VisitedFormData } from "@/types";

const DUMMY_MODE = false;
const ROSE       = "#C96B52";
const MUTED      = "#8A8078";
const BORDER     = "#E2DDD8";

// 광고 삽입 간격 — 게시글 N개마다 광고 1개
const AD_INTERVAL = 3;

export default function HomePage() {
  const [dummyRecords, setDummyRecords] = useState<VisitedRecord[]>(SAMPLE_VISITED);
  const firebase = useVisited();

  const records = DUMMY_MODE ? dummyRecords : firebase.records;
  const loading = DUMMY_MODE ? false        : firebase.loading;

  const [viewMode,       setViewMode]       = useState<"list" | "gallery">("list");
  const [filterSido,     setFilterSido]     = useState("");
  const [filterCui,      setFilterCui]      = useState("");
  const [sortBy,         setSortBy]         = useState("date");
  const [timeline,       setTimeline]       = useState(false);
  const [showSearch,     setShowSearch]     = useState(false);
  const [searchText,     setSearchText]     = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo,   setFilterDateTo]   = useState("");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const { toastMsg, clearToast, confirmTarget, closeConfirm, openAddModal } = useUIStore();
  const { myName, coupleId } = useAuthStore();

  const filtered = useMemo(() => records
    .filter(r =>
      (!filterSido     || r.sido    === filterSido) &&
      (!filterCui      || r.cuisine === filterCui)  &&
      (!filterDateFrom || r.date >= filterDateFrom)  &&
      (!filterDateTo   || r.date <= filterDateTo)    &&
      (!searchText     || [r.name, r.memo, r.sido, r.district]
        .some(s => s?.includes(searchText)))
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

  const sortedMonths = useMemo(() =>
    Object.keys(byMonth).sort((a, b) => b.localeCompare(a)),
    [byMonth]
  );

  useEffect(() => {
    if (timeline && sortedMonths.length > 0) {
      setExpandedMonths(new Set([sortedMonths[0]]));
    }
  }, [timeline]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMonth = (m: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      next.has(m) ? next.delete(m) : next.add(m);
      return next;
    });
  };

  const handleFilterDateRange = (from: string, to: string) => {
    setFilterDateFrom(from);
    setFilterDateTo(to);
  };

  // ── 저장 ──────────────────────────────────────────────────
  const handleSave = async (data: VisitedFormData, imgUrls: string[]) => {
    const { editTarget } = useUIStore.getState();
    if (DUMMY_MODE) {
      if (editTarget?.id) {
        setDummyRecords(prev => prev.map(r =>
          r.id === editTarget.id ? { ...r, ...data, imgUrls } : r
        ));
      } else {
        setDummyRecords(prev => [{
          ...data, imgUrls,
          id:         Date.now().toString(),
          coupleId:   coupleId ?? "sample-couple-001",
          authorUid:  "uid-me",
          authorName: myName,
          createdAt:  new Date().toISOString(),
          updatedAt:  new Date().toISOString(),
        }, ...prev]);
      }
    } else {
      if (editTarget?.id) {
        await firebase.update(editTarget.id, { ...data, imgUrls });
      } else {
        await firebase.add(data, imgUrls);
      }
    }
  };

  // ── 삭제 ──────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmTarget) return;
    if (DUMMY_MODE) {
      setDummyRecords(prev => prev.filter(r => r.id !== confirmTarget.id));
    } else {
      const target = records.find(r => r.id === confirmTarget.id);
      await firebase.remove(confirmTarget.id, target?.imgUrls ?? []);
    }
    closeConfirm();
  };

  // ── 로딩 ──────────────────────────────────────────────────
  if (loading) return (
    <AppShell activeTab="visited">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #F2D5CC", borderTopColor: ROSE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppShell>
  );

  // ── 빈 상태 메시지 ────────────────────────────────────────
  const emptyMsg = filterDateFrom || filterDateTo
    ? `${filterDateFrom || "시작"} ~ ${filterDateTo || "현재"} 기간에 기록이 없어요`
    : "기록이 없어요";

  return (
    <AppShell
      activeTab="visited"
      headerProps={{
        viewMode,        onViewMode:          setViewMode,
        filterSido,      onFilterSido:        setFilterSido,
        filterCui,       onFilterCui:         setFilterCui,
        sortBy,          onSort:              setSortBy,
        timeline,        onTimeline:          () => setTimeline(t => !t),
        showSearch,      onToggleSearch:      () => setShowSearch(s => !s),
        searchText,      onSearchText:        setSearchText,
        filterDateFrom,  filterDateTo,
        onFilterDateRange: handleFilterDateRange,
      }}
    >
      <div style={viewMode === "gallery" && !timeline ? {} : { padding: "12px 16px 0" }}>

        {/* ── 갤러리 모드 (타임라인 OFF) — 광고 없음 ── */}
        {viewMode === "gallery" && !timeline && (
          <GalleryGrid items={filtered} />
        )}

        {/* ── 리스트 or 타임라인 ── */}
        {(viewMode === "list" || timeline) && (
          <div>

            {timeline ? (
              // ── 타임라인: 월 섹션 사이마다 광고 1개 ────────
              sortedMonths.map((m, monthIdx) => {
                const isOpen = expandedMonths.has(m);
                return (
                  <div key={m}>
                    {/* 월 헤더 */}
                    <div
                      onClick={() => toggleMonth(m)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        paddingTop: 4, paddingBottom: isOpen ? 12 : 4,
                        cursor: "pointer", userSelect: "none",
                        WebkitUserSelect: "none",
                        marginBottom: isOpen ? 0 : 4,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#8C4A38", flexShrink: 0 }}>
                        {m.replace("-", "년 ")}월
                      </span>
                      <div style={{ flex: 1, height: 1, background: BORDER }} />
                      <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>
                        {byMonth[m].length}곳
                      </span>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: isOpen ? ROSE : "#F0EBE3",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, transition: "background 0.2s",
                      }}>
                        <svg width="8" height="8" viewBox="0 0 10 6" fill="none"
                          style={{ transform: isOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}>
                          <path d="M1 5L5 1L9 5" stroke={isOpen ? "#fff" : MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    {/* 펼쳐진 내용 */}
                    {isOpen && (
                      viewMode === "gallery"
                        ? <div style={{ marginBottom: 8 }}><GalleryGrid items={byMonth[m]} /></div>
                        : <div style={{ marginBottom: 20 }}>
                            {byMonth[m].map(r => (
                              <VisitedCard key={r.id} record={r} onDelete={() => {}} />
                            ))}
                          </div>
                    )}

                    {/* ★ 타임라인: 월 섹션 사이 광고 (마지막 월 제외) */}
                    {monthIdx < sortedMonths.length - 1 && (
                      <KakaoAdFitInFeed key={`ad-month-${m}`} />
                    )}
                  </div>
                );
              })

            ) : (
              // ── 일반 리스트: 3개마다 광고 1개 ──────────────
              filtered.map((r, idx) => (
                <div key={r.id}>
                  <VisitedCard record={r} onDelete={() => {}} />
                  {/* ★ AD_INTERVAL번째 게시글 뒤마다 광고 삽입 (마지막 제외) */}
                  {(idx + 1) % AD_INTERVAL === 0 && idx < filtered.length - 1 && (
                    <KakaoAdFitInFeed key={`ad-${idx}`} />
                  )}
                </div>
              ))
            )}

            {/* 빈 상태 */}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#C0B8B0" }}>
                <div style={{ fontSize: 44 }}>🍽️</div>
                <p style={{ marginTop: 10, fontSize: 14 }}>{emptyMsg}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 추가 버튼 */}
      <button
        onClick={openAddModal}
        style={{ position: "fixed", bottom: 76, right: 20, width: 52, height: 52, borderRadius: "50%", background: ROSE, border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(201,107,82,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, fontSize: 28 }}
      >+</button>

      <AddEditModal onSave={handleSave} />
      <DetailModal />
      {toastMsg      && <Toast message={toastMsg} onClose={clearToast} />}
      {confirmTarget && <ConfirmDialog message={confirmTarget.msg} onConfirm={handleDelete} onCancel={closeConfirm} />}
    </AppShell>
  );
}
