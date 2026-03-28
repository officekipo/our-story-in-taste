import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
// 사용 예시: cn('px-4', isActive && 'bg-rose-500', 'text-white')
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}