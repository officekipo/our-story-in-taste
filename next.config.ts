// next.config.ts
import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest:        "public",
  disable:     process.env.NODE_ENV === "development",
  register:    true,
  skipWaiting: true,
  // sw.js와 firebase-messaging-sw.js 두 SW가 공존하므로
  // sw.js는 next-pwa가 생성, firebase-messaging-sw.js는 별도 등록
  sw:          "sw.js",
  buildExcludes: [/middleware-manifest\.json$/],

  fallbackDestination: "/offline",
  fallbacks: {
    document: "/offline",
  },

  runtimeCaching: [
    {
      urlPattern: /^https:\/\/firebasestorage\.googleapis\.com/,
      handler:    "CacheFirst",
      options: {
        cacheName:  "firebase-images",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org/,
      handler:    "CacheFirst",
      options: {
        cacheName:  "map-tiles",
        expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
      handler:    "CacheFirst",
      options: {
        cacheName:  "google-fonts",
        expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^\/_next\/static\/.*/,
      handler:    "CacheFirst",
      options: {
        cacheName:  "next-static",
        expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https?.*(\/api\/)/,
      handler:    "NetworkFirst",
      options: {
        cacheName:             "api-cache",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  // ★ Turbopack: rewrites가 필요한 경우 webpack 모드로 전환
  //   로컬 개발 시 npm run dev -- --turbo 대신 npm run dev 사용
  turbopack: {},
  compress: true,
  productionBrowserSourceMaps: false,

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  // ★ Firebase Auth 리다이렉트 핸들러 프록시
  //   Vercel은 Firebase Hosting이 아니므로 /__/auth/* 경로가 없음
  //   → firebaseapp.com으로 포워딩해서 Google 로그인 정상 처리
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://our-taste-36646.firebaseapp.com/__/auth/:path*",
      },
    ];
  },

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
