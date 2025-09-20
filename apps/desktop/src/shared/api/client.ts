/**
 * API客户端统一配置和错误处理
 */

/**
 * IPC 错误类
 * 封装Tauri IPC调用中的错误信息
 */
export class IpcError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'IpcError';
  }

  /**
   * 检查是否为认证错误
   */
  isAuthError(): boolean {
    return this.code.startsWith('AUTH_') || 
           this.code.includes('UNAUTHORIZED') ||
           this.code.includes('TOKEN_EXPIRED');
  }

  /**
   * 检查是否为网络错误
   */
  isNetworkError(): boolean {
    return this.code.includes('NETWORK') || 
           this.code.includes('CONNECTION') ||
           this.code.includes('TIMEOUT');
  }

  /**
   * 检查是否需要刷新Token
   */
  shouldRefreshToken(): boolean {
    return this.code === 'AUTH_TOKEN_EXPIRED' || 
           this.code === 'TOKEN_EXPIRED';
  }
}

/**
 * 通用错误处理函数
 * 将Tauri错误转换为IpcError实例
 */
export function handleIpcError(error: any): IpcError {
  if (error instanceof IpcError) {
    return error;
  }

  // 如果error是字符串，直接使用
  if (typeof error === 'string') {
    return new IpcError('API_ERROR', error);
  }

  if (error instanceof Error) {
    // 尝试解析Tauri错误格式
    try {
      const errorData = JSON.parse(error.message);
      return new IpcError(
        errorData.code || 'API_ERROR',
        errorData.message || error.message,
        errorData.details
      );
    } catch {
      // 如果不是JSON格式，直接返回原始错误消息
      return new IpcError('API_ERROR', error.message);
    }
  }

  // 处理其他格式的错误对象
  if (error && typeof error === 'object') {
    const message = error.message || error.error || error.msg || JSON.stringify(error);
    const code = error.code || error.type || 'API_ERROR';
    return new IpcError(code, message, error);
  }
  
  return new IpcError('UNKNOWN_ERROR', 'An unknown error occurred');
}

/**
 * API响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  size: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}