// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Firebase Storage 이미지 허용
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        // Google 프로필 사진 허용 (소셜 로그인)
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // 빌드 최적화
  experimental: {
    // Turbopack 사용 시 아래 주석 해제
    // turbo: {},
  },
};

export default nextConfig;
