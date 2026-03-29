"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WishCard } from "@/components/wishlist/WishCard";
import { WishModal } from "@/components/wishlist/WishModal";
import { Toast } from "@/components/common/Toast";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AddEditModal } from "@/components/visited/AddEditModal";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { SAMPLE_WISHLIST } from "@/lib/sample-data";
import type { WishRecord } from "@/types";
import { cn } from "@/lib/utils/cn";
type WishTab = "all" | "me" | "partner" | "both";
export default function WishlistPage() {
  const [records, setRecords] = useState<WishRecord[]>(SAMPLE_WISHLIST);
  const [activeTab, setActiveTab] = useState<WishTab>("all");
  const [showWishModal, setWishModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { name: myName, partnerName } = useAuthStore();
  const { confirmTarget, closeConfirm, addModalOpen, closeModal } =
    useUIStore();
  /* ── 탭 필터링 ── */
  const meItems = records.filter((r) => r.addedByName === myName);
  const partnerItems = records.filter((r) => r.addedByName === partnerName);
  const meNames = new Set(meItems.map((r) => r.name));
  const partnerNames = new Set(partnerItems.map((r) => r.name));
  /* '둘 다': 양쪽에 같은 이름이 있는 항목 (중복 제거) */
  const bothNames = new Set([...meNames].filter((n) => partnerNames.has(n)));
  const bothItems = records.filter(
    (r, i, arr) =>
      bothNames.has(r.name) && arr.findIndex((x) => x.name === r.name) === i,
  );
  const displayed =
    activeTab === "me"
      ? meItems
      : activeTab === "partner"
        ? partnerItems
        : activeTab === "both"
          ? bothItems
          : records;
  /* ── 위시 추가 ── */
  const handleAddWish = (data: any) => {
    const newWish: WishRecord = {
      id: Date.now().toString(),
      coupleId: "sample-couple-001",
      name: data.name,
      sido: data.sido,
      district: data.district,
      cuisine: data.cuisine,
      note: data.note,
      addedBy: "uid-me",
      addedByName: myName,
      emoji: " ",
      addedDate: new Date().toISOString().slice(0, 10),
    };
    setRecords((prev) => [newWish, ...prev]);
    setToast(`⭐ "${data.name}" 위시리스트에 추가했어요!`);
  };
  /* ── 위시 삭제 ── */
  const handleDelete = () => {
    if (!confirmTarget) return;
    setRecords((prev) => prev.filter((r) => r.id !== confirmTarget.id));
    closeConfirm();
  };
  /* ── 탭 설정 ── */
  const tabs: { id: WishTab; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "me", label: `${myName}가 가고싶어` },
    { id: "partner", label: `${partnerName}가 가고싶어` },
    { id: "both", label: "둘 다 " },
  ];
  return (
    <AppShell
      activeTab="wishlist"
      headerProps={{
        visitedCount: 6,
        avgRating: "4.5",
        wishCount: records.length,
      }}
    >
      {/* 페이지 타이틀 */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-xl font-extrabold text-ink">가고 싶은 맛집</h2>
        <p className="text-sm text-muted mt-1">
          함께 가보고 싶은 곳{records.length}개
        </p>
      </div>
      {/* 탭 필터 바 */}
      <div className="flex mx-4 mb-4 bg-warm rounded-xl p-0.5 border bordermuted-light">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 py-2 rounded-[10px] text-[10px] font-medium transitionall whitespace-nowrap",
              activeTab === id
                ? "bg-white text-rose font-bold shadow-sm"
                : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {/* 카드 목록 */}
      <div className="px-4">
        {displayed.map((r, i) => (
          <WishCard key={r.id} record={r} index={i} onDelete={() => {}} />
        ))}
        {displayed.length === 0 && (
          <div className="text-center py-12 text-muted-mid">
            <div className="text-5xl mb-3">
              {activeTab === "both" ? " " : "⭐"}
            </div>
            <p className="text-sm">
              {activeTab === "both"
                ? "둘 다 가고 싶은 곳이 없어요"
                : "위시리스트가비어있어요"}
            </p>
            {activeTab === "both" && (
              <p className="text-xs mt-1.5 text-muted-light">
                같은 식당을 각자 추가하면 여기 나타나요
              </p>
            )}
          </div>
        )}
      </div>
      {/* FAB: 위시 추가 버튼 */}
      <button
        onClick={() => setWishModal(true)}
        className="fixed bottom-20 right-5 w-[52px] h-[52px] rounded-full bgsage text-white shadow-[0_4px_20px_rgba(107,158,126,0.5)] flex items-center justify-center z-[60] text-2xl"
      >
        +
      </button>
      {/* 모달 */}
      {showWishModal && (
        <WishModal onClose={() => setWishModal(false)} onSave={handleAddWish} />
      )}
      {/* 다녀왔어요 → AddEditModal */}
      {addModalOpen && <AddEditModal />}
      우리의 맛지도 개발 가이드 | Step 05. 나머지 탭 전체 구현 - 9 -
      {confirmTarget && (
        <ConfirmDialog
          message={confirmTarget.msg}
          onConfirm={handleDelete}
          onCancel={closeConfirm}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
