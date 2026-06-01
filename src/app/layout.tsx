// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next"

const APP_URL = "https://our-story-in-taste-mauve.vercel.app";

export const metadata: Metadata = {
  title: "우리의 맛지도",
  description: "함께한 모든 순간을 기억해요",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "우리의 맛지도" },
  openGraph: {
    type:        "website",
    url:         APP_URL,
    siteName:    "우리의 맛지도",
    title:       "우리의 맛지도 — 함께한 모든 순간을 기억해요",
    description: "커플 전용 맛집 기록 · 공유 앱. 둘만의 맛지도를 만들어보세요.",
    images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630, alt: "우리의 맛지도" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "우리의 맛지도",
    description: "커플 전용 맛집 기록 · 공유 앱",
    images:      [`${APP_URL}/og-image.png`],
  },
  other: { "google": "notranslate" },
};

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor:   "#C96B52",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" translate="no" className="notranslate" suppressHydrationWarning>
      <head />
      <body className="notranslate" suppressHydrationWarning>
        {/*
          ★ #app-root height 완전 제거
          - height: 100dvh 가 있으면 자식 내용이 넘쳐도 스크롤이 발생하지 않음
            → settings 등 서브 페이지 스크롤 불가의 직접 원인
          - 탭 페이지 높이 고정: template.tsx의 height:100dvh 가 단독 담당
          - 서브 페이지 스크롤: template.tsx의 minHeight:100dvh + overflow 미지정으로 허용
          - 가로 슬라이드 삐져나옴 방지: globals.css의 html,body { overflow-x:hidden } 담당
        */}
        <div id="app-root" style={{ width: "100%" }}>
          <Providers>{children}</Providers>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
