// next.config.ts
// PWA 활성화: npm install next-pwa 실행 후 아래 주석 해제
// 개발 중(dev)에는 PWA가 자동 비활성화됩니다.

import type { NextConfig } from "next";

// ── PWA 미설치 시 아래 블록 전체를 주석 처리하고 아래 export 사용 ──
// next-pwa 설치: npm install next-pwa
// 설치 후 아래 주석 해제

/*
const withPWA = require("next-pwa")({
  dest:        "public",
  disable:     process.env.NODE_ENV === "development",
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
*/

const nextConfig: NextConfig = {
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

// ── PWA 비활성 시 ──
export default nextConfig;

// ── PWA 활성화 시 위 export 대신 아래 사용 ──
// export default withPWA(nextConfig);
