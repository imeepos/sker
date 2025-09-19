// 统一的IPC客户端封装
import { invoke } from '@tauri-apps/api/core';
import type { ApiResult } from '@/shared/types';
import { API_CONSTANTS, ERROR_CODES } from '@/shared/utils/constants';

/**
 * IPC 错误类
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
   * 判断是否为认证错误
   */
  isAuthError(): boolean {
    return (
      this.code === ERROR_CODES.UNAUTHORIZED ||
      this.code === ERROR_CODES.TOKEN_EXPIRED ||
      this.code === ERROR_CODES.FORBIDDEN
    );
  }

  /**
   * 判断是否为网络错误
   */
  isNetworkError(): boolean {
    return (
      this.code === ERROR_CODES.NETWORK_ERROR ||
      this.code === ERROR_CODES.TIMEOUT ||
      this.code === ERROR_CODES.SERVER_ERROR
    );
  }
}

/**
 * 请求选项
 */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

/**
 * 统一的 IPC 调用封装
 */
export async function invokeApi<T>(
  command: string,
  args?: Record<string, unknown>,
  options: RequestOptions = {}
): Promise<T> {
  const { timeout = API_CONSTANTS.TIMEOUT, signal } = options;

  try {
    // 检查是否已取消
    if (signal?.aborted) {
      throw new IpcError(ERROR_CODES.TIMEOUT, '请求已取消');
    }

    // 设置超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new IpcError(ERROR_CODES.TIMEOUT, '请求超时'));
      }, timeout);

      // 如果有取消信号，清除超时
      signal?.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new IpcError(ERROR_CODES.TIMEOUT, '请求已取消'));
      });
    });

    // 执行实际调用
    const invokePromise = invoke<ApiResult<T>>(command, args);

    // 竞速执行
    const result = await Promise.race([invokePromise, timeoutPromise]);

    if (result.success) {
      return result.data;
    } else {
      throw new IpcError(
        result.error.code,
        result.error.message,
        result.error.details
      );
    }
  } catch (error) {
    if (error instanceof IpcError) {
      throw error;
    }

    // 处理原始错误
    console.error('IPC调用失败:', { command, args, error });
    throw new IpcError(
      ERROR_CODES.UNKNOWN_ERROR,
      `调用 ${command} 失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

/**
 * 带重试的 IPC 调用
 */
export async function invokeApiWithRetry<T>(
  command: string,
  args?: Record<string, unknown>,
  options: RequestOptions & { maxRetries?: number } = {}
): Promise<T> {
  const { maxRetries = API_CONSTANTS.MAX_RETRIES, ...requestOptions } = options;
  let lastError: IpcError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await invokeApi<T>(command, args, requestOptions);
    } catch (error) {
      lastError = error as IpcError;

      // 认证错误不重试
      if (lastError.isAuthError()) {
        throw lastError;
      }

      // 最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        throw lastError;
      }

      // 等待后重试
      const delay = API_CONSTANTS.RETRY_DELAY * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * 批量 IPC 调用
 */
export async function invokeBatch<T extends Record<string, any>>(
  requests: Array<{
    key: keyof T;
    command: string;
    args?: Record<string, unknown>;
  }>,
  options: RequestOptions = {}
): Promise<T> {
  const promises = requests.map(async ({ key, command, args }) => {
    try {
      const result = await invokeApi(command, args, options);
      return { key, result, error: null };
    } catch (error) {
      return { key, result: null, error: error as IpcError };
    }
  });

  const results = await Promise.all(promises);
  const response = {} as T;
  const errors: Array<{ key: keyof T; error: IpcError }> = [];

  for (const { key, result, error } of results) {
    if (error) {
      errors.push({ key, error });
    } else {
      (response as any)[key] = result;
    }
  }

  // 如果有错误，可以选择抛出或返回部分结果
  if (errors.length > 0) {
    console.warn('批量调用部分失败:', errors);
  }

  return response;
}

/**
 * 创建带取消功能的请求
 */
export function createCancellableRequest<T>(
  command: string,
  args?: Record<string, unknown>,
  options: Omit<RequestOptions, 'signal'> = {}
) {
  const controller = new AbortController();

  const promise = invokeApi<T>(command, args, {
    ...options,
    signal: controller.signal,
  });

  return {
    promise,
    cancel: () => controller.abort(),
  };
}

/**
 * API 客户端类
 */
export class ApiClient {
  private defaultOptions: RequestOptions;

  constructor(defaultOptions: RequestOptions = {}) {
    this.defaultOptions = defaultOptions;
  }

  async invoke<T>(
    command: string,
    args?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<T> {
    return invokeApi<T>(command, args, { ...this.defaultOptions, ...options });
  }

  async invokeWithRetry<T>(
    command: string,
    args?: Record<string, unknown>,
    options?: RequestOptions & { maxRetries?: number }
  ): Promise<T> {
    return invokeApiWithRetry<T>(command, args, {
      ...this.defaultOptions,
      ...options,
    });
  }

  createCancellableRequest<T>(
    command: string,
    args?: Record<string, unknown>,
    options?: Omit<RequestOptions, 'signal'>
  ) {
    return createCancellableRequest<T>(command, args, {
      ...this.defaultOptions,
      ...options,
    });
  }
}

// 默认客户端实例
export const apiClient = new ApiClient();
