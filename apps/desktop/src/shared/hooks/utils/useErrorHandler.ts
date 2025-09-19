// 统一错误处理 Hook
import { useCallback } from 'react';
import { useAppStore } from '@/shared/stores/app';
import { useAuthStore } from '@/shared/stores/auth';
import { IpcError } from '@/shared/api/client';

/**
 * 错误处理选项
 */
interface ErrorHandlerOptions {
  /** 是否显示通知 */
  showNotification?: boolean;
  /** 自定义错误消息 */
  customMessage?: string;
  /** 是否自动处理认证错误 */
  handleAuthErrors?: boolean;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * 错误处理结果
 */
interface ErrorHandlerResult {
  /** 处理错误的函数 */
  handleError: (error: Error, options?: ErrorHandlerOptions) => void;
  /** 处理异步操作错误的包装器 */
  withErrorHandler: <T extends (...args: any[]) => Promise<any>>(
    asyncFn: T,
    options?: ErrorHandlerOptions
  ) => T;
  /** 清除错误状态 */
  clearError: () => void;
}

/**
 * 统一错误处理 Hook
 */
export function useErrorHandler(): ErrorHandlerResult {
  const { addNotification, clearError: clearAppError } = useAppStore();
  const { clearAuth } = useAuthStore();

  /**
   * 处理错误的核心函数
   */
  const handleError = useCallback(
    (error: Error, options: ErrorHandlerOptions = {}) => {
      const {
        showNotification = true,
        customMessage,
        handleAuthErrors = true,
        onError,
      } = options;

      console.error('Error handled:', error);

      // 执行自定义错误回调
      onError?.(error);

      if (error instanceof IpcError) {
        // 处理 IPC 错误
        if (handleAuthErrors && error.isAuthError()) {
          // 认证错误处理
          if (showNotification) {
            addNotification({
              type: 'error',
              title: '认证失败',
              message: customMessage || '登录已过期，请重新登录',
            });
          }
          // 清除认证状态
          clearAuth();
          return;
        }

        if (error.isNetworkError()) {
          // 网络错误处理
          if (showNotification) {
            addNotification({
              type: 'error',
              title: '网络错误',
              message: customMessage || '网络连接失败，请检查网络设置',
            });
          }
          return;
        }

        // 其他 IPC 错误
        if (showNotification) {
          addNotification({
            type: 'error',
            title: '操作失败',
            message: customMessage || error.message,
          });
        }
      } else {
        // 处理其他类型错误
        if (showNotification) {
          addNotification({
            type: 'error',
            title: '系统错误',
            message: customMessage || '发生未知错误，请稍后重试',
          });
        }
      }
    },
    [addNotification, clearAuth]
  );

  /**
   * 包装异步函数以自动处理错误
   */
  const withErrorHandler = useCallback(
    <T extends (...args: any[]) => Promise<any>>(
      asyncFn: T,
      options: ErrorHandlerOptions = {}
    ): T => {
      return (async (...args: Parameters<T>) => {
        try {
          return await asyncFn(...args);
        } catch (error) {
          handleError(error as Error, options);
          throw error; // 重新抛出错误，让调用者决定是否继续处理
        }
      }) as T;
    },
    [handleError]
  );

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    clearAppError();
  }, [clearAppError]);

  return {
    handleError,
    withErrorHandler,
    clearError,
  };
}

/**
 * 错误边界专用的错误处理 Hook
 */
export function useErrorBoundaryHandler() {
  const { addNotification } = useAppStore();

  const handleErrorBoundary = useCallback(
    (error: Error, errorInfo: { componentStack: string }) => {
      console.error('Error Boundary caught:', error, errorInfo);

      // 添加错误通知
      addNotification({
        type: 'error',
        title: '应用错误',
        message: '应用出现异常，已自动恢复',
      });

      // 可以在这里添加错误上报逻辑
      // reportError(error, errorInfo);
    },
    [addNotification]
  );

  return { handleErrorBoundary };
}