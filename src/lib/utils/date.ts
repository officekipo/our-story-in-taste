// src/lib/utils/date.ts
import { format, differenceInDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

// "2024-02-14" → "2024년 2월 14일"
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "yyyy년 M월 d일", { locale: ko });
}

// "2024-02" → "2월" (통계 차트 X축용)
export function formatMonth(yearMonth: string): string {
  return format(parseISO(yearMonth + "-01"), "M월", { locale: ko });
}

// 교제 시작일 → D+N 숫자 반환
// 예: "2023-03-28" → 365
export function calcDDay(startDateStr: string): number {
  return differenceInDays(new Date(), parseISO(startDateStr));
}

// 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환
export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}
