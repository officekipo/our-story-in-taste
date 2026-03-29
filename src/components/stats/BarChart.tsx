"use client";
import { useState, useEffect } from "react";
interface BarChartProps {
  months: string[]; // ['2024-02', '2024-03', ...]
  byMonth: Record<string, number>; // { '2024-02': 2, ... }
  monthAvg: string;
}
/* 횟수 비율에 따라 색상 진하기 결정 */
function barColor(cnt: number, max: number) {
  const r = cnt / max;
  if (r >= 0.8) return "#3D7A5C";
  if (r >= 0.6) return "#4D8F6C";
  if (r >= 0.4) return "#6B9E7E";
  if (r >= 0.2) return "#8DC4A4";
  return "#B8DFC8";
}
export function BarChart({ months, byMonth, monthAvg }: BarChartProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);
  const maxVal = Math.max(...months.map((m) => byMonth[m] ?? 0), 1);
  return (
    <div
      className="bg-white rounded-2xl p-4 mb-3.5 shadow-sm animate-fade-up"
      style={{ animationDelay: "0.1s" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg"> </span>
        <span className="text-[15px] font-bold text-ink">월별 데이트 기록</span>
      </div>
      <p className="text-sm text-muted mb-4">
        매달 평균 <span className="font-bold text-rose">{monthAvg}회</span>
        데이트를 했어요!
      </p>
      {months.length > 0 ? (
        <>
          <div className="flex items-end gap-1.5 h-28">
            {months.map((m, mi) => {
              const cnt = byMonth[m] ?? 0;
              const h = ready
                ? Math.max(16, Math.round((cnt / maxVal) * 88))
                : 0;
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap1">
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: barColor(cnt, maxVal) }}
                  >
                    {cnt}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      height: h,
                      background: barColor(cnt, maxVal),
                      borderRadius: "5px 5px 0 0",
                      transition: `height ${0.4 + mi * 0.07}s cubicbezier(.34,1.56,.64,1)`,
                    }}
                  />
                  <span className="text-[10px] text-muted">{m.slice(5)}</span>
                </div>
              );
            })}
          </div>
          {/* 범례 */}
          <div className="flex gap-3 mt-3">
            {[
              ["적음", "#B8DFC8"],
              ["보통", "#6B9E7E"],
              ["많음", "#3D7A5C"],
            ].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: c }}
                />
                <span className="text-[10px] text-muted">{l}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-7 text-muted-mid">
          <div className="text-4xl mb-2"> </div>
          <p className="text-sm">아직 월별 데이터가 없어요</p>
        </div>
      )}
    </div>
  );
}
