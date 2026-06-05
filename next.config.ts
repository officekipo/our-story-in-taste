// next.config.ts
import type { NextConfig } from "next";

// ★ next-pwa 제거 — turbopack 환경에서 sw.js 생성 불가
//   오프라인 fallback은 firebase-messaging-sw.js에서 통합 처리

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

  // ★ Firebase Auth 리다이렉트 핸들러 프록시
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
      {
        source: "/firebase-messaging-sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
