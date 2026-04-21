// src/components/layout/SideDrawer.tsx
"use client";

import { useRouter }    from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { calcDDay }     from "@/lib/utils/date";

interface SideDrawerProps {
  open:    boolean;
  onClose: () => void;
}

export function SideDrawer({ open, onClose }: SideDrawerProps) {
  const router = useRouter();
  const { myName, partnerName, startDate, role } = useAuthStore();
  const dday = calcDDay(startDate || "2023-01-01");

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const menuItems = [
    { icon: "⚙️", label: "설정",               path: "/settings" },
    { icon: "👤", label: "내 프로필",           path: "/settings" },
    { icon: "💑", label: "커플 연동 / 초대 코드", path: "/settings" },
    { icon: "🔔", label: "알림 설정",           path: "/settings" },
  ];

  const infoItems = [
    { icon: "📄", label: "개인정보 처리방침",        path: "/settings/privacy" },
    { icon: "📋", label: "서비스 이용약관",          path: "/settings/terms" },
    { icon: "📍", label: "위치기반 서비스 이용약관", path: "/settings/location-terms" },
    { icon: "💬", label: "고객센터 / 문의하기",      path: "/settings/support" },
  ];

  return (
    <>
      {/* dim 오버레이 */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-400 bg-black/40 transition-opacity duration-200 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* 드로어 패널 */}
      <div
        className={`fixed bottom-0 right-0 top-0 z-401 flex w-[72%] max-w-[300px] flex-col overflow-y-auto bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.32,1,0.4,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 상단 프로필 영역 */}
        <div className="bg-[linear-gradient(135deg,#F2D5CC,#F0EBE3)] px-5 pb-5 pt-[52px]">
          <div className="flex items-center gap-3">
            {/* 아바타 */}
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-[2.5px] border-white bg-rose text-[20px] font-extrabold text-white">
                {(myName || "?")[0]}
              </div>
              <div className="absolute -bottom-0.5 -right-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-sage text-[8px] font-extrabold text-white">
                {(partnerName || "?")[0]}
              </div>
            </div>

            {/* 이름 + 배지 */}
            <div>
              <div className="mb-0.5 flex items-center gap-1.5">
                <p className="text-base font-extrabold text-ink">{myName || "로딩 중"}</p>
                {role === "admin" && (
                  <div className="rounded-[20px] bg-[#7B6BAE] px-[7px] py-px">
                    <span className="text-[9px] font-bold text-white">관리자</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted">{myName} ❤️ {partnerName}</p>
              <div className="mt-1 inline-flex items-center rounded-[20px] bg-rose-light px-2 py-0.5">
                <span className="text-[10px] font-bold leading-none text-rose">💑 D+{dday}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 메뉴 목록 */}
        <div className="flex-1 py-2">

          {/* 설정 메뉴 */}
          <p className="px-5 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[1.2px] text-muted">설정</p>
          {menuItems.map(({ icon, label, path }) => (
            <button
              key={label}
              onClick={() => go(path)}
              className="flex w-full cursor-pointer items-center gap-3 border-0 border-b border-border bg-transparent px-5 py-3 text-left"
            >
              <span className="w-6 text-center text-[18px]">{icon}</span>
              <span className="text-sm font-medium text-ink">{label}</span>
              <span className="ml-auto text-base text-muted-mid">›</span>
            </button>
          ))}

          {/* 관리자 메뉴 */}
          {role === "admin" && (
            <>
              <p className="px-5 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-[1.2px] text-muted">관리자</p>
              <button
                onClick={() => go("/admin")}
                className="flex w-full cursor-pointer items-center gap-3 border-0 border-b border-border bg-warm px-5 py-3 text-left"
              >
                <span className="w-6 text-center text-[18px]">🛡️</span>
                <span className="text-sm font-semibold text-[#7B6BAE]">관리자 페이지</span>
                <div className="ml-auto rounded-[20px] bg-rose-light px-[7px] py-px">
                  <span className="text-[9px] font-bold text-rose">ADMIN</span>
                </div>
              </button>
            </>
          )}

          {/* 앱 정보 */}
          <p className="px-5 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-[1.2px] text-muted">앱 정보</p>
          {infoItems.map(({ icon, label, path }) => (
            <button
              key={label}
              onClick={() => go(path)}
              className="flex w-full cursor-pointer items-center gap-3 border-0 border-b border-border bg-transparent px-5 py-3 text-left"
            >
              <span className="w-6 text-center text-[18px]">{icon}</span>
              <span className="text-sm font-medium text-ink">{label}</span>
              <span className="ml-auto text-base text-muted-mid">›</span>
            </button>
          ))}
        </div>

        {/* 하단 버전 */}
        <div className="border-t border-border px-5 pb-8 pt-4 text-center">
          <p className="text-[11px] text-muted">우리의 맛지도 v1.0.0</p>
          <p className="mt-0.5 text-[10px] text-muted-mid">Our Taste Inc.</p>
        </div>
      </div>
    </>
  );
}
