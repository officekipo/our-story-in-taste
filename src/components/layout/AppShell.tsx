// src/components/layout/AppShell.tsx
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
  const { myUid } = useAuthStore();

  /* ── 스크롤 감지 ── */
  const [scrolled, setScrolled] = useState(false);
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const next = (e.currentTarget as HTMLElement).scrollTop > 40;
    setScrolled(next);
    onScrolledChange?.(next);
  }, [onScrolledChange]);

  /* ── 알림 센터 상태 ── */
  const [bellOpen, setBellOpen] = useState(false);

  /* ── 활동 알림 unread (Firestore 실시간) ── */
  const [activityUnread, setActivityUnread] = useState(0);

  useEffect(() => {
    if (!myUid) return;
    const q = query(collection(db,"notifications"), where("uid","==",myUid), where("read","==",false));
    const unsub = onSnapshot(q, (snap) => setActivityUnread(snap.size));
    return unsub;
  }, [myUid]);

  /* ── 공지·이벤트 뱃지 (NotificationDrawer → 콜백) ── */
  const [annBadges, setAnnBadges] = useState<NotifBadges>({ activity:false, notice:false, event:false });
  const handleBadges = useCallback((b: NotifBadges) => setAnnBadges(b), []);

  /* 헤더 벨 dot: 활동 알림 unread OR 공지/이벤트 미확인 */
  const totalUnread = activityUnread + (annBadges.notice?1:0) + (annBadges.event?1:0);

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0, maxWidth:480, width:"100%", margin:"0 auto", background:"var(--color-bg)", overflow:"hidden", position:"relative" }}>

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
        style={{ flex:1, minHeight:0, overflowY:noPad?"hidden":"auto", overflowX:"hidden", paddingBottom:noPad?0:80, display:noPad?"flex":"block", flexDirection:noPad?"column":undefined, WebkitOverflowScrolling:"touch" as any }}
      >
        {children}
      </main>

      {fab}

      <BottomNav activeTab={activeTab}/>

      <NotificationDrawer
        open={bellOpen}
        onClose={() => setBellOpen(false)}
        onBadges={handleBadges}
      />
    </div>
  );
}

export default AppShell;
