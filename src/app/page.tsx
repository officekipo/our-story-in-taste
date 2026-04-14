// src/app/page.tsx
"use client";

import { useState, useMemo } from "react";
import { AppShell }          from "@/components/layout/AppShell";
import { VisitedCard }       from "@/components/visited/VisitedCard";
import { GalleryGrid }       from "@/components/visited/GalleryGrid";
import { AddEditModal }      from "@/components/visited/AddEditModal";
import { DetailModal }       from "@/components/visited/DetailModal";
import { Toast }             from "@/components/common/Toast";
import { ConfirmDialog }     from "@/components/common/ConfirmDialog";
import { useUIStore }        from "@/store/uiStore";
import { useAuthStore }      from "@/store/authStore";
import { SAMPLE_VISITED }    from "@/lib/sample-data";
import { useVisited }        from "@/hooks/useVisited";
import type { VisitedRecord, VisitedFormData } from "@/types";

const DUMMY_MODE = false;
const ROSE = "#C96B52";

export default function HomePage() {
  const [dummyRecords, setDummyRecords] = useState<VisitedRecord[]>(SAMPLE_VISITED);
  const firebase = useVisited();

  const records = DUMMY_MODE ? dummyRecords : firebase.records;
  const loading = DUMMY_MODE ? false        : firebase.loading;

  const [viewMode,   setViewMode]   = useState<"list" | "gallery">("list");
  const [filterSido, setFilterSido] = useState("");
  const [filterCui,  setFilterCui]  = useState("");
  const [sortBy,     setSortBy]     = useState("date");
  const [timeline,   setTimeline]   = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { toastMsg, clearToast, confirmTarget, closeConfirm, openAddModal } = useUIStore();
  const { myName, coupleId } = useAuthStore();

  // ★ 통계는 AppShell 안의 useStats() 훅이 실시간으로 처리하므로
  //   여기서 setStats 를 따로 호출하지 않아도 됩니다.

  const filtered = useMemo(() => records
    .filter(r =>
      (!filterSido || r.sido    === filterSido) &&
      (!filterCui  || r.cuisine === filterCui)  &&
      (!searchText || [r.name, r.memo, r.sido, r.district]
        .some(s => s?.includes(searchText)))
    )
    .sort((a, b) =>
      sortBy === "date"   ? new Date(b.date).getTime() - new Date(a.date).getTime() :
      sortBy === "rating" ? b.rating - a.rating :
      a.name.localeCompare(b.name)
    ), [records, filterSido, filterCui, searchText, sortBy]);

  const byMonth = useMemo(() => filtered.reduce((acc, r) => {
    const m = r.date.slice(0, 7);
    (acc[m] = acc[m] ?? []).push(r);
    return acc;
  }, {} as Record<string, VisitedRecord[]>), [filtered]);

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
        // 수정: undefined 필드 제거 후 전달
        await firebase.update(editTarget.id, { ...data, imgUrls });
      } else {
        // 신규: useVisited.add() 내부에서 coupleId/authorUid/authorName 자동 주입
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
        {viewMode === "gallery" && !timeline && <GalleryGrid items={filtered} />}
        {(viewMode === "list" || timeline) && (
          <div>
            {timeline
              ? Object.keys(byMonth).sort((a, b) => b.localeCompare(a)).map(m => (
                  <div key={m} style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#8C4A38" }}>
                        {m.replace("-", "년 ")}월
                      </span>
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
