"use client";
import { useState, useEffect } from "react";
import type { VisitedRecord } from "@/types";
const CUISINE_COLORS: Record<string, string> = {
  한식: "#C96B52",
  일식: "#6B9E9E",
  중식: "#C4472B",
  이탈리안: "#6B8E4A",
  프랑스: "#7B6BAE",
  멕시칸: "#D4956A",
  브런치: "#E8A77A",
  "카페/디저트": "#C96B8A",
  해산물: "#4A90C4",
  패스트푸드: "#E8C020",
  기타: "#8A8078",
};
export function CuisineChart({ visited }: { visited: VisitedRecord[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, []);
  const counts = visited.reduce(
    (acc, r) => {
      acc[r.cuisine] = (acc[r.cuisine] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxVal = top[0]?.[1] ?? 1;
  return (
    <div
      className="bg-white rounded-2xl p-4 mb-3.5 shadow-sm animate-fade-up"
      style={{ animationDelay: "0.15s" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg"> </span>
        <span className="text-[15px] font-bold text-ink">
          가장 많이 먹은 음식
        </span>
      </div>
      {top.length > 0 ? (
        <>
          <p className="text-sm text-muted mb-3.5">
            우리가 가장 좋아하는 건{" "}
            <span
              className="font-bold"
              style={{ color: CUISINE_COLORS[top[0][0]] }}
            >
              {top[0][0]}
            </span>
            !
          </p>
          {top.map(([cuisine, cnt], ci) => {
            const col = CUISINE_COLORS[cuisine] ?? "#8A8078";
            const w = ready ? (cnt / maxVal) * 100 : 0;
            return (
              <div key={cuisine} className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: col }}
                    />
                    <span className="text-sm text-ink fontmedium">
                      {cuisine}
                    </span>
                  </div>
                  <span className="text-xs text-muted">{cnt}회</span>
                </div>
                <div className="h-2 bg-cream rounded-full overflow-hidden">
                  <div
                    style={{
                      height: "100%",
                      width: `${w}%`,
                      background: col,
                      borderRadius: 99,
                      transition: `width ${0.5 + ci * 0.1}s ease`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div className="text-center py-7 text-muted-mid text-sm">
          기록이 없어요
        </div>
      )}
    </div>
  );
}
