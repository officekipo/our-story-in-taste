import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
/* ── 앱 메타데이터 (브라우저 탭 제목, SEO, PWA) ── */
export const metadata: Metadata = {
  title: "우리의 맛지도",
  description: "함께한 모든 순간을 기억해요",
  manifest: "/manifest.json", // PWA 매니페스트 (Step 09에서 생성)
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "우리의 맛지도",
  },
};
/* ── 뷰포트 설정 (모바일 확대 방지) ── */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // 핀치 줌 방지 (앱처럼 동작)
  themeColor: "#C96B52",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* Providers로 감싸야 하위 컴포넌트에서 React Query 사용 가능 */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
