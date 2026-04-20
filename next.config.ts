// next.config.ts
// next-pwa 5.6.0 활성화

import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest:        "public",
  disable:     process.env.NODE_ENV === "development",  // 개발 환경에서는 PWA 비활성
  register:    true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // Firebase Storage 이미지 캐시 (30일)
      urlPattern: /^https:\/\/firebasestorage\.googleapis\.com/,
      handler:    "CacheFirst",
      options: {
        cacheName:  "firebase-images",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      // OpenStreetMap 지도 타일 캐시 (7일)
      urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org/,
      handler:    "CacheFirst",
      options: {
        cacheName:  "map-tiles",
        expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      // Google Fonts 캐시
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
      handler:    "CacheFirst",
      options: {
        cacheName:  "google-fonts",
        expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  // ★ Turbopack 기본값(Next.js 16+) 사용 선언
  //   next-pwa의 webpack 설정과 공존 — 경고 제거
  turbopack: {},

  images: {
    remotePatterns: [
      {
        // Firebase Storage
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        // Google 프로필 사진 (소셜 로그인)
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default withPWA(nextConfig);
