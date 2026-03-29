import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // 메인 컬러
        rose: {
          DEFAULT: "#C96B52",
          light: "#F2D5CC",
          dark: "#8C4A38",
          pill: "#E8897A",
        },
        sage: {
          DEFAULT: "#6B9E7E",
          light: "#C8DED1",
          dark: "#4A7A5E",
        },
        // 텍스트
        ink: "#1A1412",
        muted: {
          DEFAULT: "#8A8078",
          light: "#E2DDD8",
          mid: "#C0B8B0",
        },
        // 배경
        bg: "#F5F0EB",
        warm: "#FAF7F3",
        cream: "#F0EBE3",
        // 기타
        accent: "#D4956A",
        gold: "#E8A020",
        tag: {
          bg: "#F0ECE8",
          text: "#8A6A5A",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "sans-serif"],
      },
      maxWidth: {
        app: "480px", // 모바일 앱 최대 너비
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
