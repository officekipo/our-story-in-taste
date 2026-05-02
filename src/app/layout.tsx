// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "우리의 맛지도",
  description: "함께한 모든 순간을 기억해요",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "우리의 맛지도" },
  other: {
    "google": "notranslate",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#C96B52",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      translate="no"
      className="notranslate"
      suppressHydrationWarning
    >
      <head>
        {/* ★ DNS Prefetch: 카카오 광고 스크립트 도메인 미리 연결 → LCP 개선 */}
        <link rel="dns-prefetch" href="//t1.daumcdn.net" />
        <link rel="preconnect" href="https://t1.daumcdn.net" crossOrigin="anonymous" />

        {/* ★ Firebase Storage 도메인 preconnect */}
        <link rel="dns-prefetch" href="//firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />

        {/* ★ 앱 아이콘 */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-96x96.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className="notranslate"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
