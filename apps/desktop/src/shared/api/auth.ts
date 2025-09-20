import { invoke } from '@tauri-apps/api/core';
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  CurrentUser,
  ChangePasswordRequest,
  UpdateUserRequest
} from '../types/auth';
import { handleIpcError } from './client';

/**
 * 认证API封装
 * 基于实际的Tauri后端认证命令
 */
export class AuthApi {
  /**
   * 用户注册
   */
  register = async (request: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await invoke<AuthResponse>('register', { request });
      return response;
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 用户登录
   */
  login = async (request: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await invoke<AuthResponse>('login', { request });
      return response;
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 验证Token有效性
   */
  validateToken = async (token: string): Promise<CurrentUser> => {
    try {
      const user = await invoke<CurrentUser>('validate_token', { token });
      return user;
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 刷新Token
   */
  refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
    try {
      const response = await invoke<AuthResponse>('refresh_token', { 
        refresh_token: refreshToken 
      });
      return response;
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 用户登出
   */
  logout = async (token: string): Promise<void> => {
    try {
      await invoke<void>('logout', { token });
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 获取当前用户信息
   */
  getCurrentUser = async (token: string): Promise<CurrentUser> => {
    try {
      const user = await invoke<CurrentUser>('get_current_user', { token });
      return user;
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 修改密码
   */
  changePassword = async (request: ChangePasswordRequest, token: string): Promise<void> => {
    try {
      await invoke<void>('change_password', { request, token });
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 更新用户信息
   */
  updateUserInfo = async (request: UpdateUserRequest, token: string): Promise<CurrentUser> => {
    try {
      const user = await invoke<CurrentUser>('update_user_info', { request, token });
      return user;
    } catch (error) {
      throw handleIpcError(error);
    }
  }
}

// 单例实例
export const authApi = new AuthApi();

// 重新导出IpcError以便其他地方使用
export { IpcError } from './client';