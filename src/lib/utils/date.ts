import { format, differenceInDays, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
// '2024-02-14' → '2024년 2월 14일'
export function formatDate(dateStr: string): string {
    return format(parseISO(dateStr), 'yyyy년 M월 d일', { locale: ko });
}
// '2024년 02월' 형식 (통계 월별 차트용)
export function formatMonth(dateStr: string): string {
    return format(parseISO(dateStr + '-01'), 'M월', { locale: ko });
}
// D+N 계산: '2023-03-28' → 365
export function calcDDay(startDate: string): number {
    return differenceInDays(new Date(), parseISO(startDate));
}