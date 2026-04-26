// src/components/visited/CalendarPicker.tsx
// 단일 날짜 선택용 (AddEditModal 방문 날짜 선택에서 사용)
// 날짜 범위 선택은 DateRangePicker.tsx 를 사용하세요.

import React, { useState } from "react";

interface CalendarPickerProps {
  value:    string;
  onChange: (v: string) => void;
  onClose:  () => void;
}

const ROSE     = "#C96B52";
const ROSE_LT  = "#F2D5CC";
const ROSE_DK  = "#8C4A38";
const INK      = "#1A1412";
const MUTED    = "#8A8078";
const MUTED_LT = "#E2DDD8";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarPicker({ value, onChange, onClose }: CalendarPickerProps) {
  const today    = new Date();
  const initDate = value ? new Date(value + "T00:00:00") : today;

  const [year,  setYear]  = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth());

  const selected  = value ? new Date(value + "T00:00:00") : null;
  const firstDay  = new Date(year, month, 1).getDay();
  const lastDate  = new Date(year, month + 1, 0).getDate();

  const weeks: number[][] = [];
  let d = 1 - firstDay;
  while (d <= lastDate) {
    const row: number[] = [];
    for (let i = 0; i < 7; i++, d++) row.push(d);
    weeks.push(row);
  }

  const pick = (day: number) => {
    if (day < 1 || day > lastDate) return;
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${year}-${mm}-${dd}`);
    onClose();
  };

  const prevMonth = () => month === 0  ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1);
  const nextMonth = () => month === 11 ? (setYear(y => y + 1), setMonth(0))  : setMonth(m => m + 1);

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.16)", minWidth: 280, animation: "cpIn 0.18s ease both" }}
    >
      <style>{`@keyframes cpIn{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

      {/* 월 네비게이션 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: MUTED, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{year}년 {month + 1}월</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: MUTED, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {DAY_LABELS.map((dl, i) => (
          <div key={dl} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, padding: "2px 0", color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : MUTED }}>{dl}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      {weeks.map((row, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 1 }}>
          {row.map((day, di) => {
            const valid   = day >= 1 && day <= lastDate;
            const isSel   = selected && valid && selected.getDate() === day && selected.getMonth() === month && selected.getFullYear() === year;
            const isToday = valid && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const textColor = !valid ? MUTED_LT
              : isSel   ? "#fff"
              : isToday ? ROSE_DK
              : di === 0 ? "#EF4444"
              : di === 6 ? "#3B82F6"
              : INK;
            return (
              <div
                key={di}
                onClick={() => pick(day)}
                style={{
                  position: "relative", height: 34,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: valid ? "pointer" : "default",
                }}
              >
                {/* 오늘 테두리 링 */}
                {isToday && !isSel && (
                  <div style={{ position: "absolute", width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${ROSE}` }} />
                )}
                {/* 선택일 채움 원 */}
                {isSel && (
                  <div style={{ position: "absolute", width: 28, height: 28, borderRadius: "50%", background: ROSE }} />
                )}
                <span style={{
                  position: "relative", zIndex: 1,
                  fontSize: 12, fontWeight: isSel || isToday ? 700 : 400,
                  color: textColor,
                }}>
                  {valid ? day : ""}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
