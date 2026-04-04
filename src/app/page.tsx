// src/app/page.tsx
// ── 데이터 소스 전환 방법 ──
//   더미 모드 (지금):  DUMMY_MODE = true  → SAMPLE_VISITED 사용
//   Firebase 모드:     DUMMY_MODE = false → useVisited() 훅 사용
//
// Firebase 연동 완료 후 DUMMY_MODE = false 로 바꾸면 끝.
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
import { useVisited }               from "@/hooks/useVisited";
import type { VisitedRecord, VisitedFormData } from "@/types";

// ── 전환 스위치 ──────────────────────────────────────────
// true  = 더미 데이터 (Firebase 연동 전)
// false = Firestore 실시간 데이터 (Firebase 연동 후)
const DUMMY_MODE = true;
// ────────────────────────────────────────────────────────

const ROSE = "#C96B52";

export default function HomePage() {
  // ── 더미 모드 상태 ──
  const [dummyRecords, setDummyRecords] = useState<VisitedRecord[]>(SAMPLE_VISITED);

  // ── Firebase 훅 (DUMMY_MODE = false 시 활성화) ──
  const firebase = useVisited();

  // ── 실제 사용할 데이터 & 함수 ──
  const records  = DUMMY_MODE ? dummyRecords : firebase.records;
  const loading  = DUMMY_MODE ? false        : firebase.loading;

  // ── 뷰 & 필터 상태 ──
  const [viewMode,   setViewMode]   = useState<"list" | "gallery">("list");
  const [filterSido, setFilterSido] = useState("");
  const [filterCui,  setFilterCui]  = useState("");
  const [sortBy,     setSortBy]     = useState("date");
  const [timeline,   setTimeline]   = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { toastMsg, clearToast, confirmTarget, closeConfirm, openAddModal } = useUIStore();
  const { myName, coupleId } = useAuthStore();

  // ── 평균 별점 ──
  const avgRating = records.length
    ? (records.reduce((s, r) => s + r.rating, 0) / records.length).toFixed(1)
    : "—";

  // ── 필터링 + 정렬 ──
  const filtered = useMemo(() => records
    .filter(r =>
      (!filterSido || r.sido === filterSido) &&
      (!filterCui  || r.cuisine === filterCui) &&
      (!searchText || [r.name, r.memo, r.sido, r.district]
        .some(s => s?.includes(searchText)))
    )
    .sort((a, b) =>
      sortBy === "date"   ? new Date(b.date).getTime() - new Date(a.date).getTime() :
      sortBy === "rating" ? b.rating - a.rating :
      a.name.localeCompare(b.name)
    ), [records, filterSido, filterCui, searchText, sortBy]);

  // ── 타임라인 월별 그룹 ──
  const byMonth = useMemo(() => filtered.reduce((acc, r) => {
    const m = r.date.slice(0, 7);
    (acc[m] = acc[m] ?? []).push(r);
    return acc;
  }, {} as Record<string, VisitedRecord[]>), [filtered]);

  // ── 저장 처리 ──
  const handleSave = async (data: VisitedFormData, imgUrls: string[]) => {
    const { editTarget } = useUIStore.getState();

    if (DUMMY_MODE) {
      // 더미 모드: 로컬 state 업데이트
      if (editTarget?.id) {
        setDummyRecords(prev =>
          prev.map(r => r.id === editTarget.id ? { ...r, ...data, imgUrls } : r)
        );
      } else {
        const newRecord: VisitedRecord = {
          ...data, imgUrls,
          id:         Date.now().toString(),
          coupleId:   coupleId ?? "sample-couple-001",
          authorUid:  "uid-me",
          authorName: myName,
          createdAt:  new Date().toISOString(),
          updatedAt:  new Date().toISOString(),
        };
        setDummyRecords(prev => [newRecord, ...prev]);
      }
    } else {
      // Firebase 모드: Firestore 저장
      if (editTarget?.id) {
        await firebase.update(editTarget.id, { ...data, imgUrls });
      } else {
        await firebase.add(data, imgUrls);
      }
    }
  };

  // ── 삭제 처리 ──
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

  // ── 로딩 스피너 (Firebase 모드) ──
  if (loading) return (
    <AppShell activeTab="visited">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #F2D5CC", borderTopColor: ROSE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppShell>
  );

  return (
    <AppShell
      activeTab="visited"
      headerProps={{
        visitedCount: records.length,
        avgRating,
        wishCount:    3,   // TODO: useWishlist().records.length 로 교체
        viewMode,      onViewMode:     setViewMode,
        filterSido,    onFilterSido:   setFilterSido,
        filterCui,     onFilterCui:    setFilterCui,
        sortBy,        onSort:         setSortBy,
        timeline,      onTimeline:     () => setTimeline(t => !t),
        showSearch,    onToggleSearch: () => setShowSearch(s => !s),
        searchText,    onSearchText:   setSearchText,
      }}
    >
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
                <p style={{ marginTop: 6, fontSize: 12, color: "#E2DDD8" }}>+ 버튼을 눌러 첫 기록을 남겨보세요</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openAddModal}
        style={{ position: "fixed", bottom: 76, right: 20, width: 52, height: 52, borderRadius: "50%", background: ROSE, border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(201,107,82,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, fontSize: 28 }}
      >+</button>

      <AddEditModal onSave={handleSave} />
      <DetailModal />
      {toastMsg     && <Toast message={toastMsg} onClose={clearToast} />}
      {confirmTarget && <ConfirmDialog message={confirmTarget.msg} onConfirm={handleDelete} onCancel={closeConfirm} />}
    </AppShell>
  );
}
