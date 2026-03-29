"use client";
import { useState } from "react";
interface CalendarPickerProps {
  value: string; // 현재 선택된 날짜 'YYYY-MM-DD'
  onChange: (v: string) => void;
  onClose: () => void;
}
const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
export function CalendarPicker({
  value,
  onChange,
  onClose,
}: CalendarPickerProps) {
  const today = new Date();
  const initDate = value ? new Date(value + "T00:00:00") : today;
  const [year, setYear] = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth()); // 0-indexed
  /* 선택된 날짜 파싱 */
  const selected = value ? new Date(value + "T00:00:00") : null;
  /* 이번 달 1일의 요일, 마지막 날 */
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  /* 달력 행 배열 생성 */
  const weeks: number[][] = [];
  let day = 1 - firstDay;
  while (day <= lastDate) {
    const row: number[] = [];
    for (let i = 0; i < 7; i++, day++) row.push(day);
    weeks.push(row);
  }
  /* 날짜 선택 */
  const pick = (d: number) => {
    if (d < 1 || d > lastDate) return;
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    onChange(`${year}-${mm}-${dd}`);
    onClose();
  };
  /* 이전 달 */
  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  /* 다음 달 */
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-2xl p-4 shadow-xl min-w-[280px] animate-scale-in"
    >
      {/* 헤더: 이전/다음 버튼 + 년/월 */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-7 h-7 text-muted text-xl flex items-center justify-center"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-ink">
          {year}년 {month + 1}월
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 text-muted text-xl flex items-center justify-center"
        >
          ›
        </button>
      </div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[10px] font-semibold py-0.5 ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "textmuted"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
      {/* 날짜 셀 */}
      {weeks.map((row, wi) => (
        <div key={wi} className="grid grid-cols-7 mb-0.5">
          {row.map((d, di) => {
            const valid = d >= 1 && d <= lastDate;
            const isSel =
              selected &&
              valid &&
              selected.getDate() === d &&
              selected.getMonth() === month &&
              selected.getFullYear() === year;
            const isToday =
              valid &&
              today.getDate() === d &&
              today.getMonth() === month &&
              today.getFullYear() === year;
            return (
              <div
                key={di}
                onClick={() => pick(d)}
                className={[
                  "text-center py-1 rounded-md text-xs",
                  valid ? "cursor-pointer" : "cursor-default",
                  isSel
                    ? "bg-rose text-white font-bold"
                    : isToday
                      ? "bg-rose-light text-rose-dark font-bold"
                      : valid
                        ? di === 0
                          ? "text-red-400"
                          : di === 6
                            ? "text-blue-400"
                            : "text-ink"
                        : "text-muted-light",
                ].join(" ")}
              >
                {valid ? d : ""}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
