export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justifycenter p-5">
      {/* 앱 로고 */}
      <div className="mb-8 text-center">
        <p
          className="text-[11px] font-semibold text-accent tracking-[3px] uppercase mb-1"
        >
          OUR STORY IN TASTE
        </p>
        <h1 className="text-3xl font-extrabold text-ink">우리의 맛지도</h1>
        <p className="text-sm text-muted mt-1">함께한 모든 순간을 기억해요</p>
      </div>
      {/* 흰 카드 */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-7">
        {children}
      </div>
    </div>
  );
}
