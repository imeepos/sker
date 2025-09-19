// 认证 API 接口
import { invokeApi } from '@/shared/api/client';
import type { User } from '@/shared/types';

/**
 * 登录请求参数
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  token: string;
  user: User;
  expires_at: number;
}

/**
 * 注册请求参数
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * 更新用户资料请求
 */
export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * 认证 API 接口
 */
export const authApi = {
  /**
   * 用户登录
   */
  login: (request: LoginRequest): Promise<LoginResponse> =>
    invokeApi('auth_login', { request }),

  /**
   * 用户登出
   */
  logout: (): Promise<void> =>
    invokeApi('auth_logout'),

  /**
   * 用户注册
   */
  register: (request: RegisterRequest): Promise<LoginResponse> =>
    invokeApi('auth_register', { request }),

  /**
   * 获取当前用户信息
   */
  getProfile: (): Promise<User> =>
    invokeApi('auth_get_profile'),

  /**
   * 更新用户资料
   */
  updateProfile: (updates: UpdateProfileRequest): Promise<User> =>
    invokeApi('auth_update_profile', { updates }),

  /**
   * 修改密码
   */
  changePassword: (request: ChangePasswordRequest): Promise<void> =>
    invokeApi('auth_change_password', { request }),

  /**
   * 刷新令牌
   */
  refreshToken: (): Promise<{ token: string; expires_at: number }> =>
    invokeApi('auth_refresh_token'),

  /**
   * 验证令牌
   */
  verifyToken: (token: string): Promise<{ valid: boolean; user?: User }> =>
    invokeApi('auth_verify_token', { token }),

  /**
   * 发送密码重置邮件
   */
  sendPasswordReset: (email: string): Promise<void> =>
    invokeApi('auth_send_password_reset', { email }),

  /**
   * 重置密码
   */
  resetPassword: (token: string, newPassword: string): Promise<void> =>
    invokeApi('auth_reset_password', { token, new_password: newPassword }),
} as const;