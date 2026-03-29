"use client";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { VisitedCard } from "@/components/visited/VisitedCard";
import { GalleryGrid } from "@/components/visited/GalleryGrid";
import { AddEditModal } from "@/components/visited/AddEditModal";
import { DetailModal } from "@/components/visited/DetailModal";
import { Toast } from "@/components/common/Toast";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useUIStore } from "@/store/uiStore";
import { SAMPLE_VISITED } from "@/lib/sample-data";
import type { VisitedRecord } from "@/types";
export default function HomePage() {
  /* ── 데이터 상태 (Step 07에서 useVisited() 훅으로 교체) ── */
  const [records, setRecords] = useState<VisitedRecord[]>(SAMPLE_VISITED);
  /* ── 뷰 모드 & 필터 상태 ── */
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list");
  const [filterSido, setFilterSido] = useState("");
  const [filterCui, setFilterCui] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [timeline, setTimeline] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  /* ── UI 스토어 ── */
  const { toastMsg, clearToast, confirmTarget, closeConfirm } = useUIStore();
  /* ── 필터링 + 정렬 (useMemo로 불필요한 재계산 방지) ── */
  const filtered = useMemo(() => {
    return records
      .filter(
        (r) =>
          (!filterSido || r.sido === filterSido) &&
          (!filterCui || r.cuisine === filterCui) &&
          (!searchText ||
            [r.name, r.memo, r.sido, r.district].some((s) =>
              s?.includes(searchText),
            )),
      )
      .sort((a, b) =>
        sortBy === "date"
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : sortBy === "rating"
            ? b.rating - a.rating
            : a.name.localeCompare(b.name),
      );
  }, [records, filterSido, filterCui, searchText, sortBy]);
  /* 월별 그룹 (타임라인용) */
  const byMonth = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        const m = r.date.slice(0, 7);
        (acc[m] = acc[m] ?? []).push(r);
        return acc;
      },
      {} as Record<string, VisitedRecord[]>,
    );
  }, [filtered]);
  /* ── 평균 별점 ── */
  const avgRating = records.length
    ? (records.reduce((s, r) => s + r.rating, 0) / records.length).toFixed(1)
    : "—";
  /* ── 삭제 처리 ── */
  const handleDelete = () => {
    if (!confirmTarget) return;
    setRecords((prev) => prev.filter((r) => r.id !== confirmTarget.id));
    closeConfirm();
  };
  /* ── 저장 처리 (Step 07에서 Firestore 저장으로 교체) ── */
  const handleSave = (data: any, imgUrls: string[]) => {
    const { editTarget } = useUIStore.getState();
    if (editTarget) {
      // 수정
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editTarget.id ? { ...r, ...data, imgUrls } : r,
        ),
      );
    } else {
      // 추가
      const newRecord: VisitedRecord = {
        ...data,
        imgUrls,
        id: Date.now().toString(),
        coupleId: "sample-couple-001",
        author: "uid-me",
        authorName: "치즈",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRecords((prev) => [newRecord, ...prev]);
    }
  };
  return (
    <AppShell
      activeTab="visited"
      headerProps={{
        visitedCount: records.length,
        avgRating,
        wishCount: 3, // Step 07에서 실제 위시 개수로 교체
        viewMode,
        onViewMode: setViewMode,
        filterSido,
        onFilterSido: setFilterSido,
        filterCui,
        onFilterCui: setFilterCui,
        sortBy,
        onSort: setSortBy,
        timeline,
        onTimeline: () => setTimeline(!timeline),
        showSearch,
        onToggleSearch: () => setShowSearch(!showSearch),
        searchText,
        onSearchText: setSearchText,
      }}
    >
      {/* ── 카드 목록 ── */}
      <div className={viewMode === "gallery" ? "" : "px-4 pt-3"}>
        {/* 갤러리 뷰 */}
        {viewMode === "gallery" && !timeline && (
          <GalleryGrid items={filtered} />
        )}
        {/* 리스트 뷰 */}
        {(viewMode === "list" || timeline) && (
          <div className={viewMode === "list" ? "" : "px-4 pt-3"}>
            {timeline
              ? /* 타임라인: 월별 그룹 */
                Object.keys(byMonth)
                  .sort((a, b) => b.localeCompare(a))
                  .map((m) => (
                    <div key={m} className="mb-6">
                      <div className="flex items-center gap-2.5 mb-3 pt-1">
                        <span className="text-[13px] font-bold text-rose-dark">
                          {m.replace("-", "년 ")}월
                        </span>
                        <div className="flex-1 h-px bg-muted-light" />
                        <span className="text-[11px] textmuted">
                          {byMonth[m].length}곳
                        </span>
                      </div>
                      {byMonth[m].map((r) => (
                        <VisitedCard
                          key={r.id}
                          record={r}
                          onDelete={() => {}}
                        />
                      ))}
                    </div>
                  ))
              : /* 일반 리스트 */
                filtered.map((r) => (
                  <VisitedCard key={r.id} record={r} onDelete={() => {}} />
                ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-mid">
                <div className="text-5xl mb-2.5"> </div>
                <p className="text-sm">기록이 없어요</p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* ── FAB: 글쓰기 버튼 ── */}
      <button
        onClick={() => useUIStore.getState().openAddModal()}
        className="fixed bottom-20 right-5 w-[52px] h-[52px] rounded-full bg-rose text-white shadow-[0_4px_20px_rgba(201,107,82,0.5)] flex items-center justify-center z-[60] text-2xl font-light"
      >
        +
      </button>
      {/* ── 모달 & 오버레이 ── */}
      <AddEditModal onSave={handleSave} />
      <DetailModal />
      {toastMsg && <Toast message={toastMsg} onClose={clearToast} />}
      {confirmTarget && (
        <ConfirmDialog
          message={confirmTarget.msg}
          onConfirm={handleDelete}
          onCancel={closeConfirm}
        />
      )}
    </AppShell>
  );
}
