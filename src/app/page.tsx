// src/app/page.tsx
//
//  수정사항:
//    ★ 커플 미연동(coupleId 없음) 시 온보딩 배너 표시
//      - 기록 0개: 화면 중앙을 차지하는 큰 온보딩 뷰
//      - 기록 1개 이상: 리스트 최상단에 작은 배너
//      - "커플 연동 코드 만들기" → /couple 이동
//      - "파트너 코드 입력하기"  → /couple 이동
//      - "혼자서 먼저 기록할게요" → 배너 닫기 (세션 동안 숨김)
//    기존 수정 유지:
//      handleDelete: closeConfirm() 후 showToast() 추가
//      AddEditModal에 onAddVisit, existingRecords prop
"use client";

import { useState, useMemo, useEffect }  from "react";
import { useRouter }                     from "next/navigation";
import { AppShell }                      from "@/components/layout/AppShell";
import { VisitedCard }                   from "@/components/visited/VisitedCard";
import { GalleryGrid }                   from "@/components/visited/GalleryGrid";
import { AddEditModal }                  from "@/components/visited/AddEditModal";
import { DetailModal }                   from "@/components/visited/DetailModal";
import { Toast }                         from "@/components/common/Toast";
import { ConfirmDialog }                 from "@/components/common/ConfirmDialog";
import { KakaoAdFitInFeed }              from "@/components/common/KakaoAdFitInFeed";
import { useUIStore }                    from "@/store/uiStore";
import { useAuthStore }                  from "@/store/authStore";
import { SAMPLE_VISITED }                from "@/lib/sample-data";
import { useVisited }                    from "@/hooks/useVisited";
import type { VisitedRecord, VisitedFormData } from "@/types";

const DUMMY_MODE = false;
const ROSE       = "#C96B52";
const ROSE_LT    = "#F2D5CC";
const SAGE       = "#6B9E7E";
const INK        = "#1A1412";
const MUTED      = "#8A8078";
const BORDER     = "#E2DDD8";
const WARM       = "#FAF7F3";

const MID_AD_INDEX = (len: number) => Math.floor(len / 2);

/* ─────────────────────────────────────────────────────────
   온보딩 배너 컴포넌트
   - variant="full"  : 기록 0개일 때 화면 중앙 큰 뷰
   - variant="slim"  : 기록 1개 이상일 때 리스트 상단 작은 배너
───────────────────────────────────────────────────────── */
function OnboardingBanner({
  variant,
  onCouple,
  onJoin,
  onDismiss,
}: {
  variant: "full" | "slim";
  onCouple:  () => void;
  onJoin:    () => void;
  onDismiss: () => void;
}) {
  if (variant === "full") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px 32px", textAlign: "center", animation: "fadeUp 0.3s ease both" }}>
        {/* 아이콘 */}
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
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.8, marginBottom: 28 }}>
          파트너와 커플 연동을 하면<br />두 사람의 맛집 기록을 함께 볼 수 있어요.<br />혼자서 먼저 기록할 수 있어요 ✨
        </p>

        <button
          onClick={onCouple}
          className="tap"
          style={{ width: "100%", maxWidth: 320, padding: "15px 0", background: ROSE, border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <span>💑</span> 커플 연동 코드 만들기
        </button>

        <button
          onClick={onJoin}
          className="tap"
          style={{ width: "100%", maxWidth: 320, padding: "14px 0", background: "#fff", border: `1.5px solid ${BORDER}`, borderRadius: 14, color: INK, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <span>🔗</span> 파트너 코드 입력하기
        </button>

        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}
        >
          혼자서 먼저 기록할게요
        </button>
      </div>
    );
  }

  // variant === "slim"
  return (
    <div style={{ background: WARM, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, animation: "fadeUp 0.3s ease both" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: ROSE_LT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
        💑
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 2 }}>파트너와 함께 기록해보세요</p>
        <p style={{ fontSize: 11, color: MUTED }}>커플 연동 시 두 사람의 기록을 함께 볼 수 있어요</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <button
          onClick={onCouple}
          className="tap"
          style={{ padding: "7px 12px", background: ROSE, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
        >
          코드 만들기
        </button>
        <button
          onClick={onJoin}
          className="tap"
          style={{ padding: "6px 12px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
        >
          코드 입력하기
        </button>
      </div>
      <button
        onClick={onDismiss}
        style={{ background: "none", border: "none", color: "#C0B8B0", fontSize: 18, cursor: "pointer", lineHeight: 1, flexShrink: 0, padding: 0 }}
        aria-label="닫기"
      >
        ×
      </button>
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

  // ★ 온보딩 배너 표시 여부 (세션 동안만 유지)
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { toastMsg, clearToast, confirmTarget, closeConfirm, openAddModal, showToast } = useUIStore();
  const { myName, coupleId } = useAuthStore();

  // 커플 미연동 + 배너 미닫기 상태
  const showOnboarding = !coupleId && !bannerDismissed;

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
          visits:     [],
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

  const handleAddVisit = async (
    existingId: string,
    entry: { date: string; rating: 1|2|3|4|5; memo: string; imgUrls: string[]; revisit: boolean | null }
  ) => {
    if (DUMMY_MODE) {
      setDummyRecords(prev => prev.map(r => {
        if (r.id !== existingId) return r;
        const newEntry = {
          ...entry,
          authorUid:  "uid-me",
          authorName: myName,
          createdAt:  new Date().toISOString(),
        };
        return { ...r, visits: [...(r.visits ?? []), newEntry], updatedAt: new Date().toISOString() };
      }));
    } else {
      await firebase.addVisit(existingId, entry);
    }
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    if (DUMMY_MODE) {
      setDummyRecords(prev => prev.filter(r => r.id !== confirmTarget.id));
    } else {
      const target = records.find(r => r.id === confirmTarget.id);
      await firebase.remove(confirmTarget.id, target?.imgUrls ?? [], target?.visits ?? []);
    }
    closeConfirm();
    showToast("기록을 삭제했어요 🗑️");
  };

  // ★ 온보딩 버튼 핸들러
  const goToCouple = (mode?: "create" | "join") => {
    router.push(mode === "join" ? "/couple?mode=join" : "/couple");
  };

  if (loading) return (
    <AppShell activeTab="visited">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #F2D5CC", borderTopColor: ROSE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppShell>
  );

  const emptyMsg = filterDateFrom || filterDateTo
    ? `${filterDateFrom || "시작"} ~ ${filterDateTo || "현재"} 기간에 기록이 없어요`
    : "기록이 없어요";

  const midAdIdx = MID_AD_INDEX(filtered.length);

  return (
    <AppShell
      activeTab="visited"
      fab={
        <button
          onClick={openAddModal}
          className="tap"
          style={{ position: "fixed", bottom: 76, right: 20, width: 52, height: 52, borderRadius: "50%", background: ROSE, border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(201,107,82,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}
        >
          <span className="tap" style={{ fontSize: 28, lineHeight: "47px" }}>+</span>
        </button>
      }
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

        {/* ── 갤러리 모드 (타임라인 OFF) ── */}
        {viewMode === "gallery" && !timeline && (
          <>
            {/* 갤러리에서도 온보딩 배너 (slim) 표시 */}
            {showOnboarding && filtered.length > 0 && (
              <div style={{ padding: "12px 16px 0" }}>
                <OnboardingBanner
                  variant="slim"
                  onCouple={() => goToCouple("create")}
                  onJoin={() => goToCouple("join")}
                  onDismiss={() => setBannerDismissed(true)}
                />
              </div>
            )}
            <GalleryGrid items={filtered} />
          </>
        )}

        {/* ── 리스트 or 타임라인 ── */}
        {(viewMode === "list" || timeline) && (
          <div>
            {/* ── 온보딩: 기록 없을 때 큰 뷰 ── */}
            {showOnboarding && filtered.length === 0 && !filterSido && !filterCui && !filterDateFrom && !filterDateTo && !searchText && (
              <OnboardingBanner
                variant="full"
                onCouple={() => goToCouple("create")}
                onJoin={() => goToCouple("join")}
                onDismiss={() => setBannerDismissed(true)}
              />
            )}

            {filtered.length > 0 && (
              <>
                {/* ── 온보딩: 기록 있을 때 slim 배너 ── */}
                {showOnboarding && (
                  <OnboardingBanner
                    variant="slim"
                    onCouple={() => goToCouple("create")}
                    onJoin={() => goToCouple("join")}
                    onDismiss={() => setBannerDismissed(true)}
                  />
                )}

                {timeline ? (
                  <>
                    <KakaoAdFitInFeed key="ad-timeline-top" />

                    {sortedMonths.map((m, monthIdx) => {
                      const isOpen = expandedMonths.has(m);
                      return (
                        <div key={m}>
                          <div
                            onClick={() => toggleMonth(m)}
                            style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4, paddingBottom: isOpen ? 12 : 4, cursor: "pointer", userSelect: "none", WebkitUserSelect: "none", marginBottom: isOpen ? 0 : 4 }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#8C4A38", flexShrink: 0 }}>{m.replace("-", "년 ")}월</span>
                            <div style={{ flex: 1, height: 1, background: BORDER }} />
                            <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{byMonth[m].length}곳</span>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: isOpen ? ROSE : "#F0EBE3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
                              <svg width="8" height="8" viewBox="0 0 10 6" fill="none" style={{ transform: isOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}>
                                <path d="M1 5L5 1L9 5" stroke={isOpen ? "#fff" : MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>

                          {isOpen && (
                            viewMode === "gallery"
                              ? <div style={{ marginBottom: 8 }}><GalleryGrid items={byMonth[m]} /></div>
                              : <div style={{ marginBottom: 20 }}>
                                  {byMonth[m].map(r => (
                                    <VisitedCard key={r.id} record={r} onDelete={() => {}} />
                                  ))}
                                </div>
                          )}

                          {monthIdx === 0 && sortedMonths.length > 1 && (
                            <KakaoAdFitInFeed key="ad-timeline-mid" />
                          )}
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
                        {idx === midAdIdx && idx < filtered.length - 1 && (
                          <KakaoAdFitInFeed key="ad-list-mid" />
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {/* 필터 적용 중이고 결과 없을 때 (온보딩과 별개) */}
            {filtered.length === 0 && (filterSido || filterCui || filterDateFrom || filterDateTo || searchText) && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#C0B8B0" }}>
                <div style={{ fontSize: 44 }}>🔍</div>
                <p style={{ marginTop: 10, fontSize: 14 }}>{emptyMsg}</p>
              </div>
            )}

            {/* 연동 완료 상태이고 기록 없을 때 */}
            {filtered.length === 0 && coupleId && !filterSido && !filterCui && !filterDateFrom && !filterDateTo && !searchText && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#C0B8B0" }}>
                <div style={{ fontSize: 44 }}>🍽️</div>
                <p style={{ marginTop: 10, fontSize: 14 }}>아직 기록이 없어요. 첫 맛집을 기록해보세요!</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AddEditModal
        onSave={handleSave}
        onAddVisit={handleAddVisit}
        existingRecords={records}
      />
      <DetailModal />
      {toastMsg      && <Toast message={toastMsg} onClose={clearToast} />}
      {confirmTarget && <ConfirmDialog message={confirmTarget.msg} onConfirm={handleDelete} onCancel={closeConfirm} />}
    </AppShell>
  );
}
