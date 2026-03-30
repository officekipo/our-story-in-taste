// src/lib/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 사용 예: cn("px-4", isActive && "bg-rose", "text-white")
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
