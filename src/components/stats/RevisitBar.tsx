"use client";
import { useState, useEffect } from "react";
import type { VisitedRecord } from "@/types";
export function RevisitBar({ visited }: { visited: VisitedRecord[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);
  const total = visited.length;
  const rv = visited.filter((r) => r.revisit === true).length;
  const pct = total > 0 ? Math.round((rv / total) * 100) : 0;
  return (
    <div
      className="bg-white rounded-2xl p-4 mb-3.5 shadow-sm animate-fade-up"
      style={{ animationDelay: "0.25s" }}
    >
      <div className="flex items-center gap-2 mb-3.5">
        <span className="text-lg"> </span>
        <span className="text-[15px] font-bold text-ink">재방문 의향</span>
      </div>
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-sm text-muted">또 가고 싶은 곳</span>
        <span className="text-base font-extrabold text-rose">{rv}곳</span>
      </div>
      <div className="h-4 bg-cream rounded-full overflow-hidden mb-2.5">
        <div
          style={{
            height: "100%",
            width: ready ? `${pct}%` : "0%",
            background: "linear-gradient(90deg,#C96B52,#E8897A)",
            borderRadius: 99,
            transition: "width 1.1s cubic-bezier(.34,1,.64,1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 8,
          }}
        >
          {pct >= 20 && (
            <span className="text-[10px] text-white fontbold">{pct}%</span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted text-center">
        방문한 곳 중 <span className="font-bold text-rose">{pct}%</span>가 또
        가고 싶은 맛집!
      </p>
    </div>
  );
}
