"use client";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  StarTabIcon,
  MapIcon,
  ChartIcon,
  ChatIcon,
} from "@/components/common/Icons";
import { cn } from "@/lib/utils/cn";
/* 탭 타입 */
export type TabId = "visited" | "wishlist" | "map" | "stats" | "community";
/* 탭 설정 배열 */
const TABS: {
  id: TabId;
  label: string;
  path: string;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  {
    id: "visited",
    label: "다녀온 곳",
    path: "/",
    icon: (a) => <HomeIcon color={a ? "#C96B52" : "#8A8078"} />,
  },
  {
    id: "wishlist",
    label: "가고싶어",
    path: "/wishlist",
    icon: (a) => <StarTabIcon color={a ? "#C96B52" : "#8A8078"} />,
  },
  {
    id: "map",
    label: "지도",
    path: "/map",
    icon: (a) => <MapIcon color={a ? "#C96B52" : "#8A8078"} />,
  },
  {
    id: "stats",
    label: "통계",
    path: "/stats",
    icon: (a) => <ChartIcon color={a ? "#C96B52" : "#8A8078"} />,
  },
  {
    id: "community",
    label: "추천",
    path: "/community",
    icon: (a) => <ChatIcon color={a ? "#C96B52" : "#8A8078"} />,
  },
];
interface BottomNavProps {
  activeTab: TabId;
}
export function BottomNav({ activeTab }: BottomNavProps) {
  const router = useRouter();
  return (
    /*
     * fixed + left-1/2 + -translate-x-1/2 + max-w-app
     * → 480px 컨테이너 가운데 정렬로 하단 고정
     * z-50: 일반 콘텐츠 위, 모달(z-[700]~) 아래
     */
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-white border-t border-muted-light flex z-50">
      {TABS.map(({ id, label, path, icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => router.push(path)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2.5",
              "border-t-2 transition-all duration-200",
              active ? "border-rose" : "border-transparent",
            )}
          >
            {icon(active)}
            <span
              className={cn(
                "text-[9px]",
                active ? "text-rose font-bold" : "text-muted font-medium",
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
