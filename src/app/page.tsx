// src/app/page.tsx
"use client";

import { useState, useMemo }        from "react";
import { AppShell }                 from "@/components/layout/AppShell";
import { VisitedCard }              from "@/components/visited/VisitedCard";
import { GalleryGrid }              from "@/components/visited/GalleryGrid";
import { AddEditModal }             from "@/components/visited/AddEditModal";
import { DetailModal }              from "@/components/visited/DetailModal";
import { Toast }                    from "@/components/common/Toast";
import { ConfirmDialog }            from "@/components/common/ConfirmDialog";
import { useUIStore }               from "@/store/uiStore";
import { useAuthStore }             from "@/store/authStore";
import { SAMPLE_VISITED }           from "@/lib/sample-data";
import type { VisitedRecord, VisitedFormData } from "@/types";

const ROSE = "#C96B52";

export default function HomePage() {
  // ── 데이터 상태 (Step07에서 useVisited() 훅으로 교체) ──
  const [records, setRecords] = useState<VisitedRecord[]>(SAMPLE_VISITED);

  // ── 뷰 & 필터 상태 ──
  const [viewMode,    setViewMode]    = useState<"list" | "gallery">("list");
  const [filterSido,  setFilterSido]  = useState("");
  const [filterCui,   setFilterCui]   = useState("");
  const [sortBy,      setSortBy]      = useState("date");
  const [timeline,    setTimeline]    = useState(false);
  const [showSearch,  setShowSearch]  = useState(false);
  const [searchText,  setSearchText]  = useState("");

  // ── UI 스토어 ──
  const { toastMsg, clearToast, confirmTarget, closeConfirm, openAddModal } = useUIStore();
  const { myName } = useAuthStore();

  // ── 평균 별점 ──
  const avgRating = records.length
    ? (records.reduce((s, r) => s + r.rating, 0) / records.length).toFixed(1)
    : "—";

  // ── 필터링 + 정렬 ──
  const filtered = useMemo(() => {
    return records
      .filter(r =>
        (!filterSido || r.sido === filterSido) &&
        (!filterCui  || r.cuisine === filterCui) &&
        (!searchText || [r.name, r.memo, r.sido, r.district].some(s => s?.includes(searchText)))
      )
      .sort((a, b) =>
        sortBy === "date"   ? new Date(b.date).getTime() - new Date(a.date).getTime() :
        sortBy === "rating" ? b.rating - a.rating :
        a.name.localeCompare(b.name)
      );
  }, [records, filterSido, filterCui, searchText, sortBy]);

  // ── 타임라인용 월별 그룹 ──
  const byMonth = useMemo(() => {
    return filtered.reduce((acc, r) => {
      const m = r.date.slice(0, 7);
      (acc[m] = acc[m] ?? []).push(r);
      return acc;
    }, {} as Record<string, VisitedRecord[]>);
  }, [filtered]);

  // ── 저장 (Step07에서 Firestore로 교체) ──
  const handleSave = (data: VisitedFormData, imgUrls: string[]) => {
    const { editTarget } = useUIStore.getState();
    if (editTarget) {
      setRecords(prev => prev.map(r => r.id === editTarget.id ? { ...r, ...data, imgUrls } : r));
    } else {
      const newRecord: VisitedRecord = {
        ...data, imgUrls,
        id:         Date.now().toString(),
        coupleId:   "sample-couple-001",
        authorUid:  "uid-me",
        authorName: myName,
        createdAt:  new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
      };
      setRecords(prev => [newRecord, ...prev]);
    }
  };

  // ── 삭제 ──
  const handleDelete = () => {
    if (!confirmTarget) return;
    setRecords(prev => prev.filter(r => r.id !== confirmTarget.id));
    closeConfirm();
  };

  return (
    <AppShell
      activeTab="visited"
      headerProps={{
        visitedCount:  records.length,
        avgRating,
        wishCount:     3,
        viewMode,      onViewMode:      setViewMode,
        filterSido,    onFilterSido:    setFilterSido,
        filterCui,     onFilterCui:     setFilterCui,
        sortBy,        onSort:          setSortBy,
        timeline,      onTimeline:      () => setTimeline(t => !t),
        showSearch,    onToggleSearch:  () => setShowSearch(s => !s),
        searchText,    onSearchText:    setSearchText,
      }}
    >
      {/* ── 카드 목록 ── */}
      <div style={viewMode === "gallery" ? {} : { padding: "12px 16px 0" }}>

        {/* 갤러리 뷰 */}
        {viewMode === "gallery" && !timeline && <GalleryGrid items={filtered} />}

        {/* 리스트 / 타임라인 뷰 */}
        {(viewMode === "list" || timeline) && (
          <div>
            {timeline
              ? Object.keys(byMonth).sort((a, b) => b.localeCompare(a)).map(m => (
                  <div key={m} style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#8C4A38" }}>{m.replace("-", "년 ")}월</span>
                      <div style={{ flex: 1, height: 1, background: "#E2DDD8" }} />
                      <span style={{ fontSize: 11, color: "#8A8078" }}>{byMonth[m].length}곳</span>
                    </div>
                    {byMonth[m].map(r => <VisitedCard key={r.id} record={r} onDelete={() => {}} />)}
                  </div>
                ))
              : filtered.map(r => <VisitedCard key={r.id} record={r} onDelete={() => {}} />)
            }
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#C0B8B0" }}>
                <div style={{ fontSize: 44 }}>🍽️</div>
                <p style={{ marginTop: 10, fontSize: 14 }}>기록이 없어요</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FAB 글쓰기 버튼 ── */}
      <button
        onClick={openAddModal}
        style={{ position: "fixed", bottom: 76, right: 20, width: 52, height: 52, borderRadius: "50%", background: ROSE, border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(201,107,82,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, fontSize: 28, fontWeight: 300, lineHeight: 1 }}
      >+</button>

      {/* ── 모달 & 오버레이 ── */}
      <AddEditModal onSave={handleSave} />
      <DetailModal />
      {toastMsg    && <Toast message={toastMsg} onClose={clearToast} />}
      {confirmTarget && <ConfirmDialog message={confirmTarget.msg} onConfirm={handleDelete} onCancel={closeConfirm} />}
    </AppShell>
  );
}
