// ============================================================
//  wishlist/page.tsx  적용 경로: src/app/wishlist/page.tsx
// ============================================================
"use client";

import { useState }        from "react";
import { AppShell }        from "@/components/layout/AppShell";
import { WishCard }        from "@/components/wishlist/WishCard";
import { WishModal }       from "@/components/wishlist/WishModal";
import { AddEditModal }    from "@/components/visited/AddEditModal";
import { Toast }           from "@/components/common/Toast";
import { ConfirmDialog }   from "@/components/common/ConfirmDialog";
import { useUIStore }      from "@/store/uiStore";
import { useAuthStore }    from "@/store/authStore";
import { SAMPLE_WISHLIST } from "@/lib/sample-data";
import { useWishlist }     from "@/hooks/useWishlist";
import { useVisited }      from "@/hooks/useVisited";
import { todayStr }        from "@/lib/utils/date";
import type { WishRecord, VisitedFormData } from "@/types";

const DUMMY_MODE = false;
const ROSE  = "#C96B52";
const MUTED = "#8A8078";
const BORDER= "#E2DDD8";
const WARM  = "#FAF7F3";
type WishTab = "all" | "me" | "partner" | "both";

export default function WishlistPage() {
  const [dummyRecords, setDummyRecords] = useState<WishRecord[]>(SAMPLE_WISHLIST);
  const firebaseWish    = useWishlist();
  const firebaseVisited = useVisited();

  const records = DUMMY_MODE ? dummyRecords : firebaseWish.records;
  const loading = DUMMY_MODE ? false        : firebaseWish.loading;

  const [activeTab,     setActiveTab]  = useState<WishTab>("all");
  const [showWishModal, setWishModal]  = useState(false);
  const [toast,         setToast]      = useState<string | null>(null);

  const { myName, partnerName, coupleId }             = useAuthStore();
  const { confirmTarget, closeConfirm, addModalOpen } = useUIStore();

  // ── 탭 필터 ──────────────────────────────────────────────
  const meItems      = records.filter(r => r.addedByName === myName);
  const partnerItems = records.filter(r => r.addedByName === partnerName);
  const meNames      = new Set(meItems.map(r => r.name));
  const partnerNames = new Set(partnerItems.map(r => r.name));
  const bothNames    = new Set([...meNames].filter(n => partnerNames.has(n)));
  const bothItems    = records.filter((r, i, arr) =>
    bothNames.has(r.name) && arr.findIndex(x => x.name === r.name) === i
  );
  const displayed =
    activeTab === "me"      ? meItems      :
    activeTab === "partner" ? partnerItems :
    activeTab === "both"    ? bothItems    :
    records;

  // ── 위시 추가 ─────────────────────────────────────────────
  const handleAddWish = async (data: {
    name: string; sido: string; district: string;
    cuisine: string; note: string; imgUrls: string[];
  }) => {
    if (DUMMY_MODE) {
      setDummyRecords(prev => [{
        id: Date.now().toString(), coupleId: coupleId ?? "sample",
        name: data.name, sido: data.sido, district: data.district,
        cuisine: data.cuisine, note: data.note,
        addedByUid: "uid-me", addedByName: myName,
        emoji: "🍽️", imgUrls: data.imgUrls, addedDate: todayStr(),
      }, ...prev]);
    } else {
      await firebaseWish.add({
        name: data.name, sido: data.sido, district: data.district,
        cuisine: data.cuisine, note: data.note,
        emoji: "🍽️", imgUrls: data.imgUrls,
      });
    }
    setToast(`⭐ "${data.name}" 위시리스트에 추가했어요!`);
  };

  // ── ★ 다녀왔어요: AddEditModal 로 프리필 후 저장 처리 ────
  // WishCard 의 onVisited 가 이 함수를 통해 uiStore.openEditModal 호출
  // → AddEditModal 이 열리고 onSave(handleSave) 로 저장
  // → 저장 완료 후 wish 삭제
  const [pendingWish, setPendingWish] = useState<WishRecord | null>(null);

  const handleVisited = (wish: WishRecord) => {
    setPendingWish(wish);
    // AddEditModal 을 위시 데이터로 프리필해서 열기
    const prefilled = {
      id: "__from_wish__",   // 특수 ID → handleSave 에서 신규 등록으로 처리
      coupleId: wish.coupleId,
      name: wish.name, sido: wish.sido, district: wish.district,
      cuisine: wish.cuisine, rating: 4 as const, date: todayStr(),
      memo: wish.note ?? "", tags: [], revisit: null as null,
      imgUrls: wish.imgUrls ?? [], emoji: wish.emoji ?? "🍽️",
      authorUid: "", authorName: myName,
      lat: wish.lat, lng: wish.lng,
      shareToComm: false, createdAt: "", updatedAt: "",
    };
    useUIStore.getState().openEditModal(prefilled as any);
  };

  // AddEditModal 저장 완료 콜백
  const handleSave = async (data: VisitedFormData, imgUrls: string[]) => {
    if (DUMMY_MODE) return;
    try {
      await firebaseVisited.add(data, imgUrls);
      // ★ 위시에서 온 경우 wish 삭제
      if (pendingWish) {
        await firebaseWish.remove(pendingWish.id);
        setPendingWish(null);
        setToast(`✅ "${data.name}" 다녀온 곳으로 이동했어요!`);
      } else {
        setToast(`🍽️ "${data.name}" 기록을 저장했어요!`);
      }
    } catch (e) {
      console.error(e);
      setToast("❌ 오류가 발생했어요.");
    }
  };

  // ── 삭제 ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmTarget) return;
    if (DUMMY_MODE) {
      setDummyRecords(prev => prev.filter(r => r.id !== confirmTarget.id));
    } else {
      await firebaseWish.remove(confirmTarget.id);
    }
    closeConfirm();
  };

  const tabs: { id: WishTab; label: string }[] = [
    { id: "all",     label: "전체" },
    { id: "me",      label: `${myName}가 추가` },
    { id: "partner", label: `${partnerName}가 추가` },
    { id: "both",    label: "둘 다 💑" },
  ];

  if (loading) return (
    <AppShell activeTab="wishlist">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 28, height: 28, border: "3px solid #C8DED1", borderTopColor: "#6B9E7E", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppShell>
  );

  return (
    <AppShell activeTab="wishlist">
      <div style={{ padding: "20px 20px 12px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1A1412", marginBottom: 4 }}>가고 싶은 맛집</h2>
        <p style={{ fontSize: 13, color: MUTED }}>함께 가보고 싶은 곳 {records.length}개</p>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", margin: "0 16px 16px", background: WARM, borderRadius: 12, padding: 3, border: `1px solid ${BORDER}` }}>
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ flex: 1, padding: "8px 4px", border: "none", borderRadius: 9, background: activeTab === id ? "#fff" : "transparent", color: activeTab === id ? ROSE : MUTED, fontSize: 10, fontWeight: activeTab === id ? 700 : 400, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", boxShadow: activeTab === id ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      {/* 카드 목록 */}
      <div style={{ padding: "0 16px" }}>
        {displayed.map((r, i) => (
          <WishCard
            key={r.id}
            record={r}
            index={i}
            onVisited={() => handleVisited(r)}   // ★ 핸들러 주입
          />
        ))}
        {displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#C0B8B0" }}>
            <div style={{ fontSize: 44 }}>{activeTab === "both" ? "💑" : "⭐"}</div>
            <p style={{ marginTop: 10, fontSize: 14 }}>
              {activeTab === "both" ? "둘 다 가고 싶은 곳이 없어요" : "위시리스트가 비어있어요"}
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setWishModal(true)}
        style={{ position: "fixed", bottom: 76, right: 20, width: 52, height: 52, borderRadius: "50%", background: "#6B9E7E", border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(107,158,126,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, fontSize: 28 }}>+</button>

      {showWishModal && <WishModal onClose={() => setWishModal(false)} onSave={handleAddWish} />}
      {/* ★ AddEditModal: 다녀왔어요 + 일반 글쓰기 공통 사용 */}
      {addModalOpen  && <AddEditModal onSave={handleSave} />}
      {confirmTarget && <ConfirmDialog message={confirmTarget.msg} onConfirm={handleDelete} onCancel={closeConfirm} />}
      {toast         && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
