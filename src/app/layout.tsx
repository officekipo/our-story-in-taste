// src/app/layout.tsx
//
// Fix: Edge 브라우저 번역 기능이 <html> 속성을 수정 → hydration 오류 발생
//   → translate="no"  : Edge/Chrome 자동 번역 비활성화
//   → suppressHydrationWarning : Dark Reader 등 확장 속성 변경도 무시
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "우리의 맛지도",
  description: "함께한 모든 순간을 기억해요",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "우리의 맛지도",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#C96B52",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ★ translate="no" → 브라우저 자동 번역 비활성화 (Edge/Chrome hydration 오류 방지)
    // ★ suppressHydrationWarning → Dark Reader 등 확장 프로그램 속성 변경 무시
    <html lang="ko" translate="no" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
