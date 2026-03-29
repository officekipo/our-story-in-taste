"use client";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import type { TabId } from "./BottomNav";
interface AppShellProps {
  children: React.ReactNode;
  activeTab: TabId;
  /* Header에 전달할 props — 다녀온 곳 탭에서만 사용 */
  headerProps?: Omit<React.ComponentProps<typeof Header>, "activeTab">;
}
export function AppShell({ children, activeTab, headerProps }: AppShellProps) {
  return (
    /*
     * min-h-screen : 최소 전체 화면 높이
     * max-w-app : 최대 너비 480px (tailwind.config.ts에서 정의)
     * mx-auto : 가운데 정렬
     * bg-bg : 배경색 #F5F0EB
     */
    <div className="min-h-screen bg-bg font-sans max-w-app mx-auto relative">
      {/* 헤더: sticky top-0 으로 스크롤해도 상단 고정 */}
      <Header activeTab={activeTab} {...headerProps} />
      {/* 콘텐츠:
pb-28 (112px) = 바텀탭 높이 64px + 여유 공간 48px
마지막 카드가 바텀탭에 가려지지 않도록 패딩 확보 */}
      <main className="pb-28">{children}</main>
      {/* 바텀탭: fixed bottom-0 으로 항상 하단 고정 */}
      <BottomNav activeTab={activeTab} />
    </div>
  );
}
