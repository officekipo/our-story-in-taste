// src/components/layout/AppShell.tsx
//
// 성능 개선 (2026-07-03):
//   ★ notifications onSnapshot — initialized 확인 후 구독 시작
//     → Auth 확정 전 permission-denied 오류 및 불필요한 구독 제거
//   ★ notifications 구독 에러 시 setActivityUnread(0) 처리
//     → notifications 컬렉션 미존재 시 앱 무한 로딩 방지
//
// 버그 수정 (v20):
//   ★ 필터바 show/hide 깜빡임(달각거림) 버그 수정
//     원인: scrollTop > 40 단일 임계값만 사용 → 게시글이 적어(예: 2개)
//           스크롤 가능 영역이 작을 때, 필터바가 접히며 main 높이가 늘어나
//           브라우저가 scrollTop을 40 아래로 강제 클램프 → scrolled=false
//           → 필터바 재확장 → main 높이 다시 줄어듦 → scrollTop 재상승
//           → scrolled=true … 무한 반복(되먹임 루프)
//     해결: (1) 히스테리시스 적용 — 숨김 80px / 표시 24px로 분리해
//               경계값 근처 미세 흔들림에 즉시 반응하지 않도록 함
//           (2) 스크롤 가능 여유 높이가 작을 때(MIN_SCROLLABLE 미만)는
//               숨김 동작 자체를 하지 않고 항상 필터바 표시 상태로 고정
//               → 되먹임 루프의 근본 원인 차단
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

  /* ── 스크롤 감지 (v20: 히스테리시스 + 최소 스크롤 잠금) ── */
  const [scrolled, setScrolled] = useState(false);

  // 필터바를 숨기는 임계값 / 다시 보여주는 임계값을 분리(히스테리시스)
  // → 경계값(옛 40px) 근처에서 1px 단위로 흔들려도 즉시 토글되지 않음
  const HIDE_AT = 80;
  const SHOW_AT = 24;
  // 스크롤 가능한 여유 높이가 이보다 작으면(콘텐츠가 짧으면) 숨김 동작 자체를 하지 않음
  // → 필터바 접힘/펼침이 스크롤 가능 범위 자체를 뒤집어버리는 되먹임 루프 차단
  const MIN_SCROLLABLE = 120;

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    const scrollTop    = el.scrollTop;
    const maxScrollTop = el.scrollHeight - el.clientHeight;

    setScrolled(prev => {
      let next = prev;

      if (maxScrollTop < MIN_SCROLLABLE) {
        // 콘텐츠가 짧아 필터바 접힘/펼침만으로 스크롤 가능 범위가 뒤집힐 수 있는 구간
        // → 항상 필터바를 보여준 상태로 고정
        next = false;
      } else if (!prev && scrollTop > HIDE_AT) {
        next = true;
      } else if (prev && scrollTop < SHOW_AT) {
        next = false;
      }

      if (next !== prev) onScrolledChange?.(next);
      return next;
    });
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
