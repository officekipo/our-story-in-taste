// ============================================================
//  wishlist/page.tsx  적용 경로: src/app/wishlist/page.tsx
//
//  Fix / Add:
//    ★ KakaoAdFitInFeed 추가 — 리스트 최상단 + 3개마다 인피드 광고
// ============================================================
"use client";

import { useState }        from "react";
import { AppShell }        from "@/components/layout/AppShell";
import { WishCard }        from "@/components/wishlist/WishCard";
import { WishModal }       from "@/components/wishlist/WishModal";
import { Toast }           from "@/components/common/Toast";
import { ConfirmDialog }   from "@/components/common/ConfirmDialog";
import { StarRating }      from "@/components/common/StarRating";
import { KakaoAdFitInFeed } from "@/components/common/KakaoAdFitInFeed"; // ★ 추가
import { useUIStore }      from "@/store/uiStore";
import { useAuthStore }    from "@/store/authStore";
import { SAMPLE_WISHLIST } from "@/lib/sample-data";
import { useWishlist }     from "@/hooks/useWishlist";
import { useVisited }      from "@/hooks/useVisited";
import { todayStr }        from "@/lib/utils/date";
import type { WishRecord, VisitedFormData } from "@/types";

const DUMMY_MODE = false;
const ROSE   = "#C96B52";
const ROSE_LT= "#F2D5CC";
const SAGE   = "#6B9E7E";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";
const INK    = "#1A1412";

type WishTab = "all" | "me" | "partner" | "both";

// ── 다녀왔어요 바텀시트 ───────────────────────────────────────
interface QuickVisitSheetProps {
  wish:     WishRecord;
  onClose:  () => void;
  onConfirm: (rating: 1|2|3|4|5, revisit: boolean) => Promise<void>;
  saving:   boolean;
}
function QuickVisitSheet({ wish, onClose, onConfirm, saving }: QuickVisitSheetProps) {
  const [rating,  setRating]  = useState<1|2|3|4|5>(4);
  const [revisit, setRevisit] = useState(true);

  return (
    <>
      {/* 딤 배경 */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 900 }}
      />
      {/* 시트 */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 20px 36px", zIndex: 901, boxShadow: "0 -4px 24px rgba(0,0,0,0.14)" }}>
        {/* 핸들 */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER, margin: "0 auto 18px" }} />

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#F0EBE3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {wish.imgUrls?.[0]
              ? <img src={wish.imgUrls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
              : (wish.emoji || "🍽️")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wish.name}</div>
            <div style={{ fontSize: 12, color: MUTED }}>{wish.sido} {wish.district} · {wish.cuisine}</div>
          </div>
          <button onClick={onClose} className="tap" style={{ background: "none", border: "none", fontSize: 20, color: MUTED, cursor: "pointer", padding: 4 }}>✕</button>
        </div>

        {/* 오늘 날짜 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FAF7F3", borderRadius: 12, marginBottom: 16, border: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 16 }}>📅</span>
          <span style={{ fontSize: 13, color: MUTED }}>방문일</span>
          <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: INK }}>{todayStr()}</span>
        </div>

        {/* 별점 */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>별점을 남겨주세요</p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <StarRating value={rating} onChange={v => setRating(v as 1|2|3|4|5)} size={32} />
          </div>
        </div>

        {/* 재방문 의향 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setRevisit(true)}
            className="tap"
            style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: `2px solid ${revisit ? ROSE : BORDER}`, background: revisit ? ROSE_LT : "#fff", color: revisit ? ROSE : MUTED, fontWeight: revisit ? 700 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          >❤️ 또 오고 싶어요</button>
          <button
            onClick={() => setRevisit(false)}
            className="tap"
            style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: `2px solid ${!revisit ? SAGE : BORDER}`, background: !revisit ? "#C8DED1" : "#fff", color: !revisit ? SAGE : MUTED, fontWeight: !revisit ? 700 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          >🤍 한 번이면 충분해요</button>
        </div>

        {/* 이동 버튼 */}
        <button
          onClick={() => onConfirm(rating, revisit)}
          disabled={saving}
          className="tap"
          style={{ width: "100%", padding: "14px 0", background: saving ? "#F2D5CC" : ROSE, border: "none", borderRadius: 14, color: "#fff", fontSize: 16, fontWeight: 800, cursor: saving ? "default" : "pointer", fontFamily: "inherit" }}
        >
          {saving ? "저장 중…" : "✅ 다녀온 곳으로 이동"}
        </button>
        <p style={{ textAlign: "center", fontSize: 11, color: MUTED, marginTop: 10 }}>위시리스트에서 자동으로 삭제돼요</p>
      </div>
    </>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function WishlistPage() {
  const [dummyRecords, setDummyRecords] = useState<WishRecord[]>(SAMPLE_WISHLIST);
  const firebaseWish    = useWishlist();
  const firebaseVisited = useVisited();

  const records = DUMMY_MODE ? dummyRecords : firebaseWish.records;
  const loading = DUMMY_MODE ? false        : firebaseWish.loading;

  const [activeTab,     setActiveTab]   = useState<WishTab>("all");
  const [showWishModal, setWishModal]   = useState(false);
  const [editingWish,   setEditingWish] = useState<WishRecord | null>(null);
  const [toast,         setToast]       = useState<string | null>(null);

  // 다녀왔어요 바텀시트 상태
  const [visitTarget,   setVisitTarget] = useState<WishRecord | null>(null);
  const [visitSaving,   setVisitSaving] = useState(false);

  const { myName, partnerName, coupleId, myUid } = useAuthStore();
  const { confirmTarget, closeConfirm } = useUIStore();

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

  // ── 위시 추가 / 수정 ──────────────────────────────────────
  const handleSaveWish = async (data: {
    name: string; sido: string; district: string;
    cuisine: string; note: string; imgUrls: string[];
    lat?: number; lng?: number;
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
      if (editingWish) {
        await firebaseWish.update(editingWish.id, {
          name: data.name, sido: data.sido, district: data.district,
          cuisine: data.cuisine, note: data.note, imgUrls: data.imgUrls,
          ...(data.lat != null && { lat: data.lat }),
          ...(data.lng != null && { lng: data.lng }),
        });
        setToast(`✏️ "${data.name}" 수정했어요!`);
      } else {
        await firebaseWish.add({
          name: data.name, sido: data.sido, district: data.district,
          cuisine: data.cuisine, note: data.note,
          emoji: "🍽️", imgUrls: data.imgUrls,
          lat: data.lat, lng: data.lng,
        });
        setToast(`⭐ "${data.name}" 위시리스트에 추가했어요!`);
      }
    }
    setEditingWish(null);
  };

  // 다녀왔어요 — 버튼 1탭 즉시 이동
  const handleQuickVisit = async (rating: 1|2|3|4|5, revisit: boolean) => {
    if (!visitTarget) return;
    setVisitSaving(true);
    try {
      const data: VisitedFormData = {
        name:        visitTarget.name,
        sido:        visitTarget.sido,
        district:    visitTarget.district,
        cuisine:     visitTarget.cuisine,
        rating,
        date:        todayStr(),
        memo:        visitTarget.note ?? "",
        tags:        [],
        imgUrls:     visitTarget.imgUrls ?? [],
        revisit,
        emoji:       visitTarget.emoji ?? "🍽️",
        shareToComm: false,
        hideAuthor:  false,
        ...(visitTarget.lat != null && { lat: visitTarget.lat }),
        ...(visitTarget.lng != null && { lng: visitTarget.lng }),
      };
      await firebaseVisited.add(data, visitTarget.imgUrls ?? []);

      // 본인이 추가한 위시만 삭제 (파트너꺼는 남겨둠)
      if (visitTarget.addedByUid === myUid) {
        await firebaseWish.remove(visitTarget.id, visitTarget.imgUrls ?? []);
      }
      setToast(`✅ "${visitTarget.name}" 다녀온 곳으로 이동했어요!`);
      setVisitTarget(null);
    } catch (e) {
      console.error(e);
      setToast("❌ 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setVisitSaving(false);
    }
  };

  // ── 삭제 ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmTarget) return;
    if (DUMMY_MODE) {
      setDummyRecords(prev => prev.filter(r => r.id !== confirmTarget.id));
    } else {
      await firebaseWish.remove(confirmTarget.id, confirmTarget.imgUrls);
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
        <div style={{ width: 28, height: 28, border: "3px solid #C8DED1", borderTopColor: SAGE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppShell>
  );

  return (
    <AppShell activeTab="wishlist" fab={
      <button
        onClick={() => { setEditingWish(null); setWishModal(true); }}
        className="tap"
        style={{ position: "fixed", bottom: 76, right: 20, width: 52, height: 52, borderRadius: "50%", background: SAGE, border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(107,158,126,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
        <span style={{ fontSize: 28, lineHeight: "48px" }}>+</span>
      </button>
    }>
      <div style={{ padding: "20px 20px 12px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 4 }}>가고 싶은 맛집</h2>
        <p style={{ fontSize: 13, color: MUTED }}>함께 가보고 싶은 곳 {records.length}개</p>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", margin: "0 16px 16px", background: WARM, borderRadius: 12, padding: 3, border: `1px solid ${BORDER}` }}>
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="tap"
            style={{ flex: 1, padding: "8px 4px", border: "none", borderRadius: 9, background: activeTab === id ? "#fff" : "transparent", color: activeTab === id ? ROSE : MUTED, fontSize: 10, fontWeight: activeTab === id ? 700 : 400, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", boxShadow: activeTab === id ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ★ 카드 목록 — 최상단 + 3개마다 인피드 광고 삽입 */}
      <div style={{ padding: "0 16px" }}>
        {displayed.length > 0 && (
          // 최상단 광고
          <KakaoAdFitInFeed />
        )}
        {displayed.map((r, i) => (
          <div key={r.id}>
            <WishCard
              record={r}
              index={i}
              onVisited={() => setVisitTarget(r)}
              onEdit={() => { setEditingWish(r); setWishModal(true); }}
            />
            {/* 3개마다 광고 (0-based index 기준: 2, 5, 8 ...) */}
            {(i + 1) % 3 === 0 && i + 1 < displayed.length && (
              <KakaoAdFitInFeed />
            )}
          </div>
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

      {/* 다녀왔어요 바텀시트 */}
      {visitTarget && (
        <QuickVisitSheet
          wish={visitTarget}
          onClose={() => setVisitTarget(null)}
          onConfirm={handleQuickVisit}
          saving={visitSaving}
        />
      )}

      {showWishModal && (
        <WishModal
          editRecord={editingWish ?? undefined}
          onClose={() => { setWishModal(false); setEditingWish(null); }}
          onSave={handleSaveWish}
        />
      )}
      {confirmTarget && <ConfirmDialog message={confirmTarget.msg} onConfirm={handleDelete} onCancel={closeConfirm} />}
      {toast         && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
