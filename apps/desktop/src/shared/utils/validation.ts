// 验证工具函数
import { z } from 'zod';

/**
 * 邮箱验证
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 密码强度验证
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 0;

  if (password.length < 8) {
    issues.push('密码长度至少为8位');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    issues.push('必须包含小写字母');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('必须包含大写字母');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    issues.push('必须包含数字');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('建议包含特殊字符');
  } else {
    score += 1;
  }

  return {
    isValid: issues.length === 0,
    score,
    issues,
  };
}

/**
 * 通用 Zod 模式
 */
export const commonSchemas = {
  // 邮箱模式
  email: z.string().email('请输入有效的邮箱地址'),

  // 密码模式
  password: z
    .string()
    .min(8, '密码长度至少为8位')
    .regex(/[a-z]/, '必须包含小写字母')
    .regex(/[A-Z]/, '必须包含大写字母')
    .regex(/\d/, '必须包含数字'),

  // 用户名模式
  username: z
    .string()
    .min(2, '用户名至少2个字符')
    .max(50, '用户名最多50个字符')
    .regex(
      /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
      '用户名只能包含字母、数字、下划线和中文'
    ),

  // 手机号模式
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),

  // URL模式
  url: z.string().url('请输入有效的URL'),

  // 必填字符串
  requiredString: z.string().min(1, '此字段为必填项'),

  // 可选字符串
  optionalString: z.string().optional(),

  // 正整数
  positiveInteger: z.number().int().positive('必须为正整数'),

  // 非负整数
  nonNegativeInteger: z.number().int().min(0, '不能为负数'),
};

/**
 * 表单验证助手
 */
export function createFormSchema<T extends Record<string, z.ZodTypeAny>>(
  fields: T
): z.ZodObject<T> {
  return z.object(fields);
}

/**
 * 验证ID格式（UUID）
 */
export function isValidId(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * 文件类型验证
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * 文件大小验证
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}
