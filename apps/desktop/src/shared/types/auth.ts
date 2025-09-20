/**
 * 认证相关类型定义
 * 对应后端 Tauri 认证命令接口
 */

// 登录请求
export interface LoginRequest {
  email: string;
  password: string;
}

// 注册请求
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

// 认证响应
export interface AuthResponse {
  token: string;
  refresh_token: string;
  user: CurrentUser;
  expires_in: number; // 过期时间（秒数）
}

// 当前用户信息
export interface CurrentUser {
  user_id: string;
  email: string;
  username: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

// 刷新Token请求
export interface RefreshTokenRequest {
  refresh_token: string;
}

// API 错误响应
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// API 结果包装
export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

// 认证状态
export interface AuthState {
  isAuthenticated: boolean;
  user: CurrentUser | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
}

// 修改密码请求
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// 更新用户信息请求
export interface UpdateUserRequest {
  username?: string;
  email?: string;
}

// 认证操作
export interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setAuth: (response: AuthResponse) => void;
  clearAuth: () => void;
}