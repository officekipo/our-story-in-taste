import { format, differenceInDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
/**
 * 'YYYY-MM-DD' → '2024년 2월 14일'
 * 카드 하단 날짜 표시에 사용
 */
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "yyyy년 M월 d일", { locale: ko });
}
/**
 * 'YYYY-MM-DD' → '2월' (통계 월별 차트 X축 레이블용)
 */
export function formatMonth(yearMonth: string): string {
  // yearMonth 형식: '2024-02'
  return format(parseISO(yearMonth + "-01"), "M월", { locale: ko });
}
/**
 * 교제 시작일 → D+N 숫자 반환
 * 예: '2023-03-28' → 365
 */
// export function calcDDay(startDateStr: string): number {
//   return differenceInDays(new Date(), parseISO(startDateStr));
// }


export function calcDDay(startDateStr: string | undefined | null): number {
  // 1. 데이터가 아예 없는 경우 방어
  if (!startDateStr) return 0;

  // 2. ISO 파싱 시도
  const startDate = parseISO(startDateStr);

  // 3. 파싱된 결과가 유효한 날짜인지 체크 (isValid는 Date 객체를 받음)
  if (!isValid(startDate)) {
    console.warn("유효하지 않은 날짜 형식입니다:", startDateStr);
    return 0;
  }

  // 4. 오늘 날짜와 차이 계산
  return differenceInDays(new Date(), startDate);
}


/**
 * 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환
 * 글쓰기 모달 기본값에 사용
 */
export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}
