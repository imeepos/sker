/**
 * 凭据管理API
 * 提供安全的用户凭据存储和获取功能
 */

import { invoke } from '@tauri-apps/api/core';

// 类型定义
export interface SaveCredentialsRequest {
  email: string;
  password: string;
  remember: boolean;
}

export interface StoredCredentials {
  email: string;
  password: string;
  remember: boolean;
}

/**
 * 凭据管理API类
 */
export class CredentialsApi {
  /**
   * 保存登录凭据
   */
  static async saveCredentials(request: SaveCredentialsRequest): Promise<void> {
    try {
      await invoke('save_credentials', { request });
    } catch (error) {
      console.error('保存凭据失败:', error);
      throw new Error(error instanceof Error ? error.message : '保存凭据失败');
    }
  }

  /**
   * 获取保存的凭据
   */
  static async getSavedCredentials(): Promise<StoredCredentials | null> {
    try {
      const result = await invoke<StoredCredentials | null>('get_saved_credentials');
      return result;
    } catch (error) {
      console.error('获取保存的凭据失败:', error);
      throw new Error(error instanceof Error ? error.message : '获取保存的凭据失败');
    }
  }

  /**
   * 清除保存的凭据
   */
  static async clearSavedCredentials(): Promise<void> {
    try {
      await invoke('clear_saved_credentials');
    } catch (error) {
      console.error('清除保存的凭据失败:', error);
      throw new Error(error instanceof Error ? error.message : '清除保存的凭据失败');
    }
  }

  /**
   * 检查是否有保存的凭据
   */
  static async hasSavedCredentials(): Promise<boolean> {
    try {
      const result = await invoke<boolean>('has_saved_credentials');
      return result;
    } catch (error) {
      console.error('检查保存的凭据失败:', error);
      return false;
    }
  }
}

// 导出默认实例
export const credentialsApi = CredentialsApi;