// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

const APP_URL = "https://our-story-in-taste-mauve.vercel.app";

export const metadata: Metadata = {
  title: "우리의 맛지도",
  description: "함께한 모든 순간을 기억해요",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "우리의 맛지도" },

  // ── Open Graph (카카오톡·페이스북 등 링크 공유 썸네일) ──
  openGraph: {
    type:        "website",
    url:         APP_URL,
    siteName:    "우리의 맛지도",
    title:       "우리의 맛지도 — 함께한 모든 순간을 기억해요",
    description: "커플 전용 맛집 기록 · 공유 앱. 둘만의 맛지도를 만들어보세요.",
    images: [
      {
        url:    `${APP_URL}/og-image.png`,  // public/og-image.png (1200×630px)
        width:  1200,
        height: 630,
        alt:    "우리의 맛지도",
      },
    ],
  },

  // ── Twitter Card ──
  twitter: {
    card:        "summary_large_image",
    title:       "우리의 맛지도",
    description: "커플 전용 맛집 기록 · 공유 앱",
    images:      [`${APP_URL}/og-image.png`],
  },

  // ★ Next.js metadata API로 통합 관리 (JSX head에 중복 추가 금지)
  other: {
    "google": "notranslate",   // Google 번역 비활성화
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
      translate="no"           // Chrome/Safari 자동 번역 비활성화
      className="notranslate"  // ★ Edge Microsoft Translator 비활성화 (Edge는 이 class를 우선 처리)
      suppressHydrationWarning // Dark Reader 등 브라우저 확장 속성 무시
    >
      <head />
      <body
        className="notranslate"  // ★ body에도 적용 — Edge 번역 완전 차단
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
