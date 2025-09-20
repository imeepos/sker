import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 类名合并工具函数
 * 基于clsx和tailwind-merge，用于条件性地组合类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}