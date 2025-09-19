import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 类名合并工具函数
 * 基于 clsx 和 tailwind-merge 实现
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
