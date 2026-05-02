// next.config.ts
import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest:        "public",
  disable:     process.env.NODE_ENV === "development",
  register:    true,
  skipWaiting: true,
  // ★ 광고 스크립트 캐시 제외 (카카오 AdFit은 캐시하면 안 됨)
  buildExcludes: [/middleware-manifest\.json$/],
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
    {
      // Next.js 정적 assets (/_next/static)
      urlPattern: /^\/_next\/static\/.*/,
      handler:    "CacheFirst",
      options: {
        cacheName:  "next-static",
        expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      // API 라우트 — NetworkFirst (항상 최신 데이터)
      urlPattern: /^https?.*(\/api\/)/,
      handler:    "NetworkFirst",
      options: {
        cacheName:        "api-cache",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  turbopack: {},

  // ★ 압축 활성화 → JS/CSS 번들 크기 감소
  compress: true,

  // ★ 프로덕션 소스맵 비활성화 → 번들 크기 감소, LCP 개선
  productionBrowserSourceMaps: false,

  images: {
    // ★ 최신 이미지 포맷 우선 사용 → LCP 개선
    formats: ["image/avif", "image/webp"],
    // ★ 이미지 캐시 TTL 최대화
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // ★ 헤더 캐시 설정 → 정적 자산 재사용
  async headers() {
    return [
      {
        source: "/icons/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
