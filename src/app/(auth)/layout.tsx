// src/app/(auth)/layout.tsx
// 로그인 / 회원가입 / 커플 연동 공통 레이아웃

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-[linear-gradient(160deg,#FDF1ED_0%,#F5F0EB_50%)] px-6 py-10">
      {/* 앱 로고 */}
      <div className="mb-8 text-center">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[3px] text-accent">
          OUR STORY IN TASTE
        </p>
        <h1 className="text-[30px] font-extrabold tracking-[-0.5px] text-ink">
          우리의 맛지도
        </h1>
      </div>

      {/* 흰 카드 */}
      <div className="w-full max-w-[380px] rounded-3xl bg-white px-7 pb-8 pt-7 shadow-[0_4px_24px_rgba(201,107,82,0.1)]">
        {children}
      </div>
    </div>
  );
}
