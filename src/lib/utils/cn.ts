import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
/**
 * 여러 Tailwind 클래스를 안전하게 합쳐주는 함수
 *
 * 사용 예시:
 * cn('px-4 py-2', isActive && 'bg-rose text-white', 'rounded-xl')
 * → isActive가 true면: 'px-4 py-2 bg-rose text-white rounded-xl'
 * → isActive가 false면: 'px-4 py-2 rounded-xl'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}