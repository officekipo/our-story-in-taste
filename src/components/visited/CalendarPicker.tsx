// src/components/visited/CalendarPicker.tsx

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
  const today   = new Date();
  const initDate = value ? new Date(value + "T00:00:00") : today;

  const [year,  setYear]  = React.useState(initDate.getFullYear());
  const [month, setMonth] = React.useState(initDate.getMonth());

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

  const prevMonth = () => month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1);
  const nextMonth = () => month === 11 ? (setYear(y => y + 1), setMonth(0)) : setMonth(m => m + 1);

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.16)", minWidth: 280, animation: "scaleIn 0.18s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: MUTED, width: 28, height: 28 }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{year}년 {month + 1}월</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: MUTED, width: 28, height: 28 }}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {DAY_LABELS.map((dl, i) => (
          <div key={dl} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, padding: "2px 0", color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : MUTED }}>{dl}</div>
        ))}
      </div>

      {weeks.map((row, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 1 }}>
          {row.map((day, di) => {
            const valid   = day >= 1 && day <= lastDate;
            const isSel   = selected && valid && selected.getDate() === day && selected.getMonth() === month && selected.getFullYear() === year;
            const isToday = valid && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const textColor = !valid ? MUTED_LT : isSel ? "#fff" : isToday ? ROSE_DK : di === 0 ? "#EF4444" : di === 6 ? "#3B82F6" : INK;
            return (
              <div
                key={di}
                onClick={() => pick(day)}
                style={{ textAlign: "center", padding: "5px 0", borderRadius: 6, fontSize: 12, cursor: valid ? "pointer" : "default", background: isSel ? ROSE : isToday ? ROSE_LT : "transparent", color: textColor, fontWeight: isSel || isToday ? 700 : 400 }}
              >
                {valid ? day : ""}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

import React from "react";
