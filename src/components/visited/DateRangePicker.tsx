// src/components/visited/DateRangePicker.tsx
// 날짜 기간(범위) 선택 전용 컴포넌트
// Header.tsx 의 검색창 날짜 필터에서 사용

import React, { useState } from "react";

const ROSE     = "#C96B52";
const ROSE_LT  = "#FBECE8";
const ROSE_DK  = "#8C4A38";
const INK      = "#1A1412";
const MUTED    = "#8A8078";
const MUTED_LT = "#E2DDD8";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const toDS = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

interface DateRangePickerProps {
  valueFrom: string;
  valueTo:   string;
  onChange:  (from: string, to: string) => void;
  onClose:   () => void;
}

export function DateRangePicker({ valueFrom, valueTo, onChange, onClose }: DateRangePickerProps) {
  const now      = new Date();
  const todayStr = toDS(now.getFullYear(), now.getMonth(), now.getDate());

  const initDate = valueFrom ? new Date(valueFrom + "T00:00:00") : now;
  const [year,  setYear]  = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth());

  // 내부 선택 상태
  const [fromDate,  setFromDate]  = useState(valueFrom || "");
  const [toDate,    setToDate]    = useState(valueTo   || "");
  const [hoverDate, setHoverDate] = useState("");

  // step: "from" = 시작일 대기 / "to" = 종료일 대기
  const [step, setStep] = useState<"from" | "to">(
    valueFrom && !valueTo ? "to" : "from"
  );

  // 달력 주(週) 생성
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const weeks: number[][] = [];
  let d = 1 - firstDay;
  while (d <= lastDate) {
    const row: number[] = [];
    for (let i = 0; i < 7; i++, d++) row.push(d);
    weeks.push(row);
  }

  // hover 포함 실효 범위 (역방향 자동 처리)
  const eFrom = step === "to" && hoverDate
    ? (hoverDate < fromDate ? hoverDate : fromDate)
    : fromDate;
  const eTo = step === "to" && hoverDate
    ? (hoverDate < fromDate ? fromDate : hoverDate)
    : toDate;
  const hasRange = !!(eFrom && eTo && eFrom !== eTo);

  const pick = (day: number) => {
    if (day < 1 || day > lastDate) return;
    const ds = toDS(year, month, day);

    if (step === "from") {
      setFromDate(ds);
      setToDate("");
      setStep("to");
    } else {
      const [f, t] = ds <= fromDate ? [ds, fromDate] : [fromDate, ds];
      setFromDate(f);
      setToDate(t);
      setStep("from");
      onChange(f, t);
      onClose();
    }
  };

  const reset = () => {
    setFromDate(""); setToDate(""); setStep("from"); setHoverDate("");
    onChange("", "");
  };

  const prevMonth = () =>
    month === 0  ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1);
  const nextMonth = () =>
    month === 11 ? (setYear(y => y + 1), setMonth(0))  : setMonth(m => m + 1);

  const statusText =
    step === "to" && fromDate
      ? `${fromDate}  →  종료일을 선택하세요`
      : fromDate && toDate
        ? `${fromDate}  ~  ${toDate}`
        : "시작일을 선택하세요";

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: "#fff", borderRadius: 20, padding: 16,
        boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
        minWidth: 300, animation: "drpIn 0.18s ease both",
      }}
    >
      <style>{`@keyframes drpIn{from{transform:scale(0.94);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

      {/* 선택 상태 표시 */}
      <div style={{
        marginBottom: 12, padding: "8px 12px",
        background: step === "to" ? "#FFF5F2" : "#FAF7F4",
        borderRadius: 10,
        border: `1px solid ${step === "to" ? "#F2D5CC" : MUTED_LT}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        minHeight: 36,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.5, color: step === "to" ? ROSE : MUTED }}>
          {step === "to" ? "🗓 " : "📅 "}{statusText}
        </span>
        {(fromDate || toDate) && (
          <button
            onClick={reset}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: MUTED, padding: "2px 8px", borderRadius: 6, flexShrink: 0, fontFamily: "inherit" }}
          >초기화</button>
        )}
      </div>

      {/* 월 네비게이션 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: MUTED, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{year}년 {month + 1}월</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: MUTED, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 2 }}>
        {DAY_LABELS.map((dl, i) => (
          <div key={dl} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, padding: "2px 0", color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : MUTED }}>
            {dl}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      {weeks.map((row, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {row.map((day, di) => {
            const valid = day >= 1 && day <= lastDate;
            const ds    = valid ? toDS(year, month, day) : "";

            const isFromDay  = valid && ds === eFrom;
            const isToDay    = valid && !!eTo && ds === eTo && eTo !== eFrom;
            const isInRange  = valid && hasRange && ds > eFrom && ds < eTo;
            const isTodayDay = valid && ds === todayStr;
            const circled    = isFromDay || isToDay;

            // 범위 연결 스트립
            const rightStrip = isFromDay && hasRange && di < 6;
            const leftStrip  = isToDay   && hasRange && di > 0;

            const textColor = !valid    ? MUTED_LT
              : circled                 ? "#fff"
              : isTodayDay              ? ROSE_DK
              : di === 0               ? "#EF4444"
              : di === 6               ? "#3B82F6"
              : INK;

            return (
              <div
                key={di}
                onClick={() => valid && pick(day)}
                onMouseEnter={() => { if (step === "to" && valid && ds) setHoverDate(ds); }}
                onMouseLeave={() => { if (step === "to") setHoverDate(""); }}
                style={{
                  position: "relative", height: 34,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: valid ? "pointer" : "default",
                }}
              >
                {/* 범위 내 날 — 전체 배경 */}
                {isInRange && (
                  <div style={{ position: "absolute", top: 3, bottom: 3, left: 0, right: 0, background: ROSE_LT }} />
                )}
                {/* 시작일 우측 연결 스트립 */}
                {rightStrip && (
                  <div style={{ position: "absolute", top: 3, bottom: 3, left: "50%", right: 0, background: ROSE_LT }} />
                )}
                {/* 종료일 좌측 연결 스트립 */}
                {leftStrip && (
                  <div style={{ position: "absolute", top: 3, bottom: 3, left: 0, right: "50%", background: ROSE_LT }} />
                )}
                {/* 오늘 테두리 링 */}
                {isTodayDay && !circled && (
                  <div style={{ position: "absolute", width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${ROSE}` }} />
                )}
                {/* 선택일 채움 원 */}
                {circled && (
                  <div style={{ position: "absolute", width: 28, height: 28, borderRadius: "50%", background: ROSE }} />
                )}
                <span style={{
                  position: "relative", zIndex: 1, fontSize: 12, lineHeight: 1,
                  fontWeight: circled || isTodayDay ? 700 : 400,
                  color: textColor,
                }}>
                  {valid ? day : ""}
                </span>
              </div>
            );
          })}
        </div>
      ))}

      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        style={{
          width: "100%", marginTop: 12, padding: "9px 0",
          background: "#F5F0EB", border: "none", borderRadius: 10,
          color: MUTED, fontSize: 12, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >닫기</button>
    </div>
  );
}
