// next.config.ts
import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest:        "public",
  disable:     process.env.NODE_ENV === "development",
  register:    true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],

  // ★ 오프라인 fallback 페이지 지정
  //   네트워크 없을 때 공룡 게임 대신 커스텀 페이지 표시
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
