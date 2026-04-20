// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "우리의 맛지도",
  description: "함께한 모든 순간을 기억해요",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "우리의 맛지도" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#C96B52",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // translate="no" → Edge/Chrome 자동 번역 비활성화 (hydration 오류 방지)
    // suppressHydrationWarning → Dark Reader 등 브라우저 확장 속성 수정 무시
    <html lang="ko" translate="no" suppressHydrationWarning>
      <head>
        {/* 추가 메타태그로 번역 비활성화 강제 */}
        <meta name="google" content="notranslate" />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
