// src/app/onboarding/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { markOnboardingDone, isOnboardingDone } from "./done";

/* ── 슬라이드별 그라데이션 배경 ── */
const SLIDES = [
  {
    gradient: ["#FFEDE6", "#FDD5C3", "#F5F0EB"],
    accentColor: "#C96B52",
    tagline: "OUR STORY IN TASTE",
    title: "우리의 맛지도",
    desc: "함께한 모든 순간을\n맛있게 기억해요 ❤️",
    preview: "home",
  },
  {
    gradient: ["#FFF0E8", "#FDDDC8", "#F5F0EB"],
    accentColor: "#C96B52",
    tagline: "RECORD TOGETHER",
    title: "다녀온 곳 기록",
    desc: "사진, 별점, 메모까지\n우리만의 맛집 일기",
    preview: "card",
  },
  {
    gradient: ["#E8F5EE", "#C8DED1", "#F5F0EB"],
    accentColor: "#6B9E7E",
    tagline: "WISHLIST",
    title: "가고 싶은 곳 저장",
    desc: "둘 다 원하는 곳은\n따로 모아줘요 💑",
    preview: "wish",
  },
  {
    gradient: ["#FFEDE6", "#F2D5CC", "#F5F0EB"],
    accentColor: "#C96B52",
    tagline: "DATE STATS",
    title: "우리 데이트 통계",
    desc: "월별 데이트 횟수부터\n좋아하는 음식까지",
    preview: "stats",
  },
] as const;

/* ══════════════════════════════════
   앱 UI 목업 컴포넌트
══════════════════════════════════ */

/* 공통 폰 프레임 */
function PhoneFrame({ children, bg = "#F5F0EB" }: { children: React.ReactNode; bg?: string }) {
  return (
    <div style={{
      width: 200, height: 360,
      background: "#1A1412",
      borderRadius: 28,
      padding: 4,
      boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)",
      position: "relative",
      flexShrink: 0,
    }}>
      {/* 노치 */}
      <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 50, height: 5, background: "#1A1412", borderRadius: 3, zIndex: 10 }} />
      <div style={{
        width: "100%", height: "100%",
        background: bg,
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
      }}>
        {children}
      </div>
    </div>
  );
}

/* 목업 1 — 홈 피드 */
function HomeMockup() {
  const cards = [
    { emoji: "🏯", name: "온지음 맞춤관", tag: "한식", stars: 5, color: "#FDE8E5" },
    { emoji: "🍺", name: "을지로 이자카야", tag: "일식", stars: 5, color: "#E8F5EE" },
    { emoji: "🥂", name: "르 쁘띠 파리", tag: "프랑스", stars: 5, color: "#E8F0FD" },
  ];
  return (
    <div style={{ padding: "28px 8px 8px", height: "100%", overflow: "hidden" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 4px" }}>
        <div>
          <p style={{ fontSize: 6, color: "#D4956A", letterSpacing: 1, fontWeight: 700 }}>OUR STORY IN TASTE</p>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#1A1412" }}>우리의 맛지도</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ v: 6, l: "방문" }, { v: "4.7", l: "평균" }].map(({ v, l }) => (
            <div key={l} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: "#1A1412" }}>{v}</p>
              <p style={{ fontSize: 5, color: "#8A8078" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
      {/* 카드 목록 */}
      {cards.map((c, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: 8, marginBottom: 6, padding: "6px 8px", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{c.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 7, fontWeight: 700, color: "#1A1412", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
            <p style={{ fontSize: 6, color: "#8A8078" }}>{c.tag}</p>
          </div>
          <p style={{ fontSize: 7, color: "#E8A020" }}>{"★".repeat(c.stars)}</p>
        </div>
      ))}
    </div>
  );
}

/* 목업 2 — 기록 카드 */
function CardMockup() {
  return (
    <div style={{ padding: "28px 8px 8px", height: "100%", overflow: "hidden" }}>
      <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        {/* 사진 영역 */}
        <div style={{ height: 80, background: "linear-gradient(135deg, #FDE8E5, #F2D5CC)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🥂</div>
        <div style={{ padding: "8px 8px 6px" }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: "#1A1412", marginBottom: 2 }}>르 쁘띠 파리</p>
          <p style={{ fontSize: 6, color: "#8A8078", marginBottom: 4 }}>📍 서울 이태원 · 프랑스</p>
          <p style={{ fontSize: 9, color: "#E8A020", marginBottom: 4 }}>★★★★★</p>
          <p style={{ fontSize: 6, color: "#1A1412", lineHeight: 1.5, marginBottom: 6 }}>100일 기념 깜짝 이벤트! 꽃다발도 받고 🌹</p>
          <div style={{ display: "flex", gap: 4 }}>
            {["기념일", "로맨틱"].map(t => <span key={t} style={{ fontSize: 5, background: "#F0ECE8", color: "#8A6A5A", borderRadius: 10, padding: "2px 5px" }}>#{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 목업 3 — 위시리스트 */
function WishMockup() {
  const items = [
    { emoji: "🥩", name: "청담 더 스테이크", by: "치즈", isMe: true },
    { emoji: "🐟", name: "부산 자갈치 회",   by: "민준", isMe: false },
    { emoji: "🏰", name: "경복궁 뷰 카페",   by: "치즈", isMe: true },
  ];
  return (
    <div style={{ padding: "28px 8px 8px", height: "100%", overflow: "hidden" }}>
      <p style={{ fontSize: 9, fontWeight: 800, color: "#1A1412", marginBottom: 2, padding: "0 4px" }}>가고 싶은 맛집</p>
      <div style={{ display: "flex", gap: 3, marginBottom: 8, padding: "0 4px" }}>
        {["전체", "치즈", "민준", "둘 다 💑"].map((l, i) => (
          <div key={l} style={{ padding: "2px 5px", borderRadius: 8, background: i === 0 ? "#C96B52" : "#fff", border: `1px solid ${i === 0 ? "#C96B52" : "#E2DDD8"}` }}>
            <span style={{ fontSize: 5, color: i === 0 ? "#fff" : "#8A8078", fontWeight: i === 0 ? 700 : 400 }}>{l}</span>
          </div>
        ))}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: 8, marginBottom: 5, padding: "6px 7px", display: "flex", alignItems: "center", gap: 5, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "#F0EBE3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{item.emoji}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 7, fontWeight: 700, color: "#1A1412" }}>{item.name}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.isMe ? "#C96B52" : "#6B9E7E", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 5, fontWeight: 700 }}>{item.by[0]}</div>
              <span style={{ fontSize: 5, color: item.isMe ? "#C96B52" : "#4A7A5E", fontWeight: 600 }}>{item.by}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* 목업 4 — 통계 */
function StatsMockup() {
  const bars = [
    { m: "10월", cnt: 2, h: 30 },
    { m: "11월", cnt: 3, h: 45 },
    { m: "12월", cnt: 1, h: 15 },
    { m: "1월",  cnt: 4, h: 60 },
    { m: "2월",  cnt: 3, h: 45 },
    { m: "3월",  cnt: 5, h: 75 },
  ];
  const cuisines = [
    { name: "한식", pct: 40, color: "#C96B52" },
    { name: "일식", pct: 25, color: "#6B9E9E" },
    { name: "프랑스", pct: 20, color: "#7B6BAE" },
    { name: "브런치", pct: 15, color: "#E8A77A" },
  ];
  return (
    <div style={{ padding: "28px 8px 8px", height: "100%", overflow: "hidden" }}>
      {/* 통계 3개 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[{ icon: "📍", v: 6, l: "총 방문" }, { icon: "📅", v: "2.1", l: "월평균" }, { icon: "💗", v: "83%", l: "재방문" }].map(({ icon, v, l }) => (
          <div key={l} style={{ flex: 1, background: "#fff", borderRadius: 7, padding: "5px 4px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 10 }}>{icon}</p>
            <p style={{ fontSize: 8, fontWeight: 800, color: "#C96B52" }}>{v}</p>
            <p style={{ fontSize: 5, color: "#8A8078" }}>{l}</p>
          </div>
        ))}
      </div>
      {/* 바 차트 */}
      <div style={{ background: "#fff", borderRadius: 7, padding: "6px 6px 4px", marginBottom: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: 6, fontWeight: 700, color: "#1A1412", marginBottom: 4 }}>📈 월별 데이트</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40 }}>
          {bars.map(b => (
            <div key={b.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <div style={{ width: "100%", height: b.h * 0.53, background: "#6B9E7E", borderRadius: "2px 2px 0 0" }} />
              <p style={{ fontSize: 4, color: "#8A8078" }}>{b.m}</p>
            </div>
          ))}
        </div>
      </div>
      {/* 음식 바 */}
      <div style={{ background: "#fff", borderRadius: 7, padding: "6px 6px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: 6, fontWeight: 700, color: "#1A1412", marginBottom: 4 }}>🍴 음식 종류</p>
        {cuisines.map(c => (
          <div key={c.name} style={{ marginBottom: 3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
              <span style={{ fontSize: 5, color: "#1A1412" }}>{c.name}</span>
              <span style={{ fontSize: 5, color: "#8A8078" }}>{c.pct}%</span>
            </div>
            <div style={{ height: 3, background: "#F0EBE3", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${c.pct}%`, background: c.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PREVIEW_MAP = {
  home:  <HomeMockup />,
  card:  <CardMockup />,
  wish:  <WishMockup />,
  stats: <StatsMockup />,
};

/* ══════════════════════════════════
   메인 온보딩 컴포넌트
══════════════════════════════════ */
export default function OnboardingPage() {
  const router          = useRouter();
  const [idx, setIdx]   = useState(0);
  const touchStart      = useRef<number | null>(null);
  const isLast          = idx === SLIDES.length - 1;
  const slide           = SLIDES[idx];

  useEffect(() => {
    if (typeof window !== "undefined" && isOnboardingDone()) {
      router.replace("/login");
    }
  }, []);

  const goTo = (n: number) => {
    if (n < 0 || n >= SLIDES.length || n === idx) return;
    setIdx(n);
  };

  const goNext = () => {
    if (isLast) {
      markOnboardingDone();
      router.push("/login");
    } else {
      goTo(idx + 1);
    }
  };

  /* 그라데이션 문자열 */
  const bgGrad = `linear-gradient(160deg, ${slide.gradient[0]} 0%, ${slide.gradient[1]} 45%, ${slide.gradient[2]} 100%)`;

  return (
    <div
      style={{ minHeight: "100vh", maxWidth: 480, margin: "0 auto", background: bgGrad, transition: "background 0.5s ease", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const diff = e.changedTouches[0].clientX - touchStart.current;
        if (diff < -50) goNext();
        if (diff > 50 && idx > 0) goTo(idx - 1);
        touchStart.current = null;
      }}
    >
      {/* ── 건너뛰기 ── */}
      <button
        onClick={() => { markOnboardingDone(); router.push("/login"); }}
        style={{ position: "absolute", top: 20, right: 20, zIndex: 10, background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#8A8078", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
      >
        건너뛰기
      </button>

      {/* ── 상단 텍스트 영역 ── */}
      <div style={{ padding: "72px 32px 24px", flexShrink: 0 }}>
        <p
          key={`tag-${idx}`}
          style={{ fontSize: 10, fontWeight: 700, color: slide.accentColor, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10, opacity: 0.9, animation: "fadeUp 0.35s ease both" }}
        >
          {slide.tagline}
        </p>
        <h1
          key={`title-${idx}`}
          style={{ fontSize: idx === 0 ? 36 : 30, fontWeight: 800, color: "#1A1412", letterSpacing: -0.5, marginBottom: 12, lineHeight: 1.15, animation: "fadeUp 0.35s ease 0.04s both" }}
        >
          {slide.title}
        </h1>
        <p
          key={`desc-${idx}`}
          style={{ fontSize: 15, color: "#8A8078", lineHeight: 1.7, whiteSpace: "pre-line", animation: "fadeUp 0.35s ease 0.08s both" }}
        >
          {slide.desc}
        </p>
      </div>

      {/* ── 폰 목업 ── */}
      <div
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", position: "relative" }}
      >
        {/* 뒤 장식 원 */}
        <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.25)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.2)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

        <div
          key={`phone-${idx}`}
          style={{ animation: "phoneIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both", animationDelay: "0.06s" }}
        >
          <PhoneFrame bg="#F5F0EB">
            {PREVIEW_MAP[slide.preview]}
          </PhoneFrame>
        </div>
      </div>

      {/* ── 하단 컨트롤 ── */}
      <div style={{ padding: "20px 32px 52px", flexShrink: 0 }}>
        {/* 도트 */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{ width: i === idx ? 28 : 8, height: 8, borderRadius: 4, background: i === idx ? slide.accentColor : "rgba(201,107,82,0.25)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
            />
          ))}
        </div>

        {/* 버튼 */}
        <button
          onClick={goNext}
          style={{ width: "100%", padding: "16px", background: slide.accentColor, border: "none", borderRadius: 18, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 8px 28px ${slide.accentColor}55`, transition: "all 0.2s", letterSpacing: 0.3 }}
          onTouchStart={(e) => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
          onTouchEnd={(e) => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; goNext(); }}
        >
          {isLast ? "지금 시작하기 🎉" : "다음 →"}
        </button>

        {isLast && (
          <button
            onClick={() => { markOnboardingDone(); router.push("/login"); }}
            style={{ width: "100%", marginTop: 12, padding: "12px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "none", borderRadius: 14, color: "#8A8078", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
          >
            이미 계정이 있어요 — 로그인
          </button>
        )}
      </div>

      {/* ── 애니메이션 ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes phoneIn {
          from { opacity: 0; transform: translateY(32px) scale(0.88); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
