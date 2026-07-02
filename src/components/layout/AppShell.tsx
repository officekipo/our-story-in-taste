// src/components/layout/AppShell.tsx
//
// 성능 개선 (2026-07-03):
//   ★ notifications onSnapshot — initialized 확인 후 구독 시작
//     → Auth 확정 전 permission-denied 오류 및 불필요한 구독 제거
//   ★ notifications 구독 에러 시 setActivityUnread(0) 처리
//     → notifications 컬렉션 미존재 시 앱 무한 로딩 방지
"use client";

import { useState, useCallback, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db }           from "@/lib/firebase/config";
import { useStats }     from "@/hooks/useStats";
import { useAuthStore } from "@/store/authStore";
import { Header }       from "./Header";
import { BottomNav }    from "./BottomNav";
import { useTabAnim }   from "@/app/template";
import { NotificationDrawer, type NotifBadges } from "@/components/common/NotificationDrawer";

interface AppShellProps {
  children:          React.ReactNode;
  activeTab:         "visited"|"wishlist"|"map"|"stats"|"community";
  headerProps?:      Record<string, any>;
  filterBar?:        React.ReactNode;
  noPad?:            boolean;
  fab?:              React.ReactNode;
  onScrolledChange?: (scrolled: boolean) => void;
}

export function AppShell({ children, activeTab, headerProps, filterBar, noPad, fab, onScrolledChange }: AppShellProps) {
  useStats();

  const { animClass, onAnimationEnd } = useTabAnim();
  const { myUid, initialized } = useAuthStore();

  /* ── 스크롤 감지 ── */
  const [scrolled, setScrolled] = useState(false);
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const next = (e.currentTarget as HTMLElement).scrollTop > 40;
    setScrolled(next);
    onScrolledChange?.(next);
  }, [onScrolledChange]);

  /* ── 알림 센터 상태 ── */
  const [bellOpen, setBellOpen] = useState(false);

  /* ── 활동 알림 unread (Firestore 실시간)
       ★ initialized 확인 후 구독 — Auth 확정 전 permission-denied 방지
       ★ 에러 시 0으로 fallback — notifications 컬렉션 없어도 앱 정상 동작 ── */
  const [activityUnread, setActivityUnread] = useState(0);

  useEffect(() => {
    if (!initialized || !myUid) return;

    const q = query(
      collection(db, "notifications"),
      where("uid", "==", myUid),
      where("read", "==", false)
    );

    const unsub = onSnapshot(
      q,
      (snap) => setActivityUnread(snap.size),
      // ★ 에러 핸들러 추가: 컬렉션 없거나 인덱스 없으면 0으로 처리
      (err) => {
        console.warn("[notifications 구독 오류]", err.code);
        setActivityUnread(0);
      }
    );

    return unsub;
  }, [initialized, myUid]);

  /* ── 공지·이벤트 뱃지 (NotificationDrawer → 콜백) ── */
  const [annBadges, setAnnBadges] = useState<NotifBadges>({ activity: false, notice: false, event: false });
  const handleBadges = useCallback((b: NotifBadges) => setAnnBadges(b), []);

  /* 헤더 벨 dot: 활동 알림 unread OR 공지/이벤트 미확인 */
  const totalUnread = activityUnread + (annBadges.notice ? 1 : 0) + (annBadges.event ? 1 : 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, maxWidth: 480, width: "100%", margin: "0 auto", background: "var(--color-bg)", overflow: "hidden", position: "relative" }}>

      <Header
        activeTab={activeTab}
        scrolled={scrolled}
        unreadCount={totalUnread}
        onBell={() => setBellOpen(true)}
        {...(headerProps ?? {})}
      />

      {filterBar}

      <main
        className={animClass}
        onAnimationEnd={onAnimationEnd}
        onScroll={handleScroll}
        style={{ flex: 1, minHeight: 0, overflowY: noPad ? "hidden" : "auto", overflowX: "hidden", paddingBottom: noPad ? 0 : 80, display: noPad ? "flex" : "block", flexDirection: noPad ? "column" : undefined, WebkitOverflowScrolling: "touch" as any }}
      >
        {children}
      </main>

      {fab}

      <BottomNav activeTab={activeTab} />

      <NotificationDrawer
        open={bellOpen}
        onClose={() => setBellOpen(false)}
        onBadges={handleBadges}
      />
    </div>
  );
}

export default AppShell;
