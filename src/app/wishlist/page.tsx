// src/app/wishlist/page.tsx
"use client";

import { useState }          from "react";
import { AppShell }          from "@/components/layout/AppShell";
import { WishCard }          from "@/components/wishlist/WishCard";
import { WishModal }         from "@/components/wishlist/WishModal";
import { AddEditModal }      from "@/components/visited/AddEditModal";
import { Toast }             from "@/components/common/Toast";
import { ConfirmDialog }     from "@/components/common/ConfirmDialog";
import { useUIStore }        from "@/store/uiStore";
import { useAuthStore }      from "@/store/authStore";
import { SAMPLE_WISHLIST }   from "@/lib/sample-data";
import type { WishRecord, VisitedFormData } from "@/types";

const ROSE = "#C96B52";
const SAGE = "#6B9E7E";
const MUTED = "#8A8078";
const BORDER = "#E2DDD8";
const WARM = "#FAF7F3";

type WishTab = "all" | "me" | "partner" | "both";

export default function WishlistPage() {
  const [records,      setRecords]    = useState<WishRecord[]>(SAMPLE_WISHLIST);
  const [activeTab,    setActiveTab]  = useState<WishTab>("all");
  const [showWishModal,setWishModal]  = useState(false);
  const [toast,        setToast]      = useState<string | null>(null);

  const { myName, partnerName }                           = useAuthStore();
  const { confirmTarget, closeConfirm, addModalOpen, closeModal } = useUIStore();

  // ── 탭 필터링 ──
  const meItems      = records.filter(r => r.addedByName === myName);
  const partnerItems = records.filter(r => r.addedByName === partnerName);
  const meNames      = new Set(meItems.map(r => r.name));
  const partnerNames = new Set(partnerItems.map(r => r.name));
  // "둘 다": 이름 기준으로 양쪽에 모두 존재하는 항목 (중복 제거)
  const bothNames    = new Set([...meNames].filter(n => partnerNames.has(n)));
  const bothItems    = records.filter((r, i, arr) =>
    bothNames.has(r.name) && arr.findIndex(x => x.name === r.name) === i
  );
  const displayed =
    activeTab === "me"      ? meItems      :
    activeTab === "partner" ? partnerItems :
    activeTab === "both"    ? bothItems    :
    records;

  // ── 위시 추가 ──
  const handleAddWish = (data: { name: string; sido: string; district: string; cuisine: string; note: string }) => {
    const newWish: WishRecord = {
      id:          Date.now().toString(),
      coupleId:    "sample-couple-001",
      name:        data.name,
      sido:        data.sido,
      district:    data.district,
      cuisine:     data.cuisine,
      note:        data.note,
      addedByUid:  "uid-me",
      addedByName: myName,
      emoji:       "🍽️",
      addedDate:   new Date().toISOString().slice(0, 10),
    };
    setRecords(prev => [newWish, ...prev]);
    setToast(`⭐ "${data.name}" 위시리스트에 추가했어요!`);
  };

  // ── 위시 삭제 ──
  const handleDelete = () => {
    if (!confirmTarget) return;
    setRecords(prev => prev.filter(r => r.id !== confirmTarget.id));
    closeConfirm();
  };

  const tabs: { id: WishTab; label: string }[] = [
    { id: "all",     label: "전체" },
    { id: "me",      label: `${myName}가 가고싶어` },
    { id: "partner", label: `${partnerName}가 가고싶어` },
    { id: "both",    label: "둘 다 💑" },
  ];

  return (
    <AppShell activeTab="wishlist" headerProps={{ visitedCount: 6, avgRating: "4.5", wishCount: records.length }}>

      {/* 타이틀 */}
      <div style={{ padding: "20px 20px 12px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1A1412", marginBottom: 4 }}>가고 싶은 맛집</h2>
        <p style={{ fontSize: 13, color: MUTED }}>함께 가보고 싶은 곳 {records.length}개</p>
      </div>

      {/* 탭 필터 바 */}
      <div style={{ display: "flex", margin: "0 16px 16px", background: WARM, borderRadius: 12, padding: 3, border: `1px solid ${BORDER}` }}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{ flex: 1, padding: "8px 4px", border: "none", borderRadius: 9, background: activeTab === id ? "#fff" : "transparent", color: activeTab === id ? ROSE : MUTED, fontSize: 10, fontWeight: activeTab === id ? 700 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap", boxShadow: activeTab === id ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 카드 목록 */}
      <div style={{ padding: "0 16px" }}>
        {displayed.map((r, i) => <WishCard key={r.id} record={r} index={i} />)}
        {displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#C0B8B0" }}>
            <div style={{ fontSize: 44 }}>{activeTab === "both" ? "💑" : "⭐"}</div>
            <p style={{ marginTop: 10, fontSize: 14 }}>
              {activeTab === "both" ? "둘 다 가고 싶은 곳이 없어요" : "위시리스트가 비어있어요"}
            </p>
            {activeTab === "both" && <p style={{ fontSize: 12, marginTop: 6, color: "#E2DDD8" }}>같은 식당을 각자 추가하면 여기 나타나요</p>}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setWishModal(true)}
        style={{ position: "fixed", bottom: 76, right: 20, width: 52, height: 52, borderRadius: "50%", background: SAGE, border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(107,158,126,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, fontSize: 28, fontWeight: 300 }}
      >+</button>

      {/* 모달 */}
      {showWishModal && <WishModal onClose={() => setWishModal(false)} onSave={handleAddWish} />}
      {addModalOpen  && <AddEditModal />}
      {confirmTarget && <ConfirmDialog message={confirmTarget.msg} onConfirm={handleDelete} onCancel={closeConfirm} />}
      {toast         && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
