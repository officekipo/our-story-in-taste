/* 공통 props — 모든 아이콘에서 사용 */
interface IconProps {
  color?: string; // hex 또는 Tailwind 색상 변수 아님, 순수 hex
  size?: number; // px
}
const D = "#1A1412"; // 기본 ink 색상
/* ── 바텀탭 아이콘 ── */
export function HomeIcon({ color = D, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 11l9-9 9 9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 9v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function StarTabIcon({ color = D, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function MapIcon({ color = D, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke={color}
        strokeWidth="1.8"
      />
      <circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}
export function ChartIcon({ color = D, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="13" width="4" height="8" rx="1" fill={color} />
      <rect
        x="10"
        y="9"
        width="4"
        height="12"
        rx="1"
        fill={color}
        opacity="0.7"
      />
      <rect
        x="17"
        y="5"
        width="4"
        height="16"
        rx="1"
        fill={color}
        opacity="0.5"
      />
    </svg>
  );
}
export function ChatIcon({ color = D, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M17 3H7a2 2 0 00-2 2v14l4-3h8a2 2 0 002-2V5a2 2 0 00-2-2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 9h6M9 13h4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
/* ── 공통 UI 아이콘 ── */
export function PlusIcon({ color = "#FFFFFF", size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line
        x1="12"
        y1="5"
        x2="12"
        y2="19"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function FlagIcon({ color = D, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
        stroke={color}
        strokeWidth="1.8"
      />
      <line x1="4" y1="22" x2="4" y2="15" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}
