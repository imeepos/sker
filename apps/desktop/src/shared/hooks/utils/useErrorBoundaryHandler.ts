import { useCallback } from 'react';
import { useAppStore } from '../../stores/app';

export interface ErrorInfo {
  componentStack: string;
}

/**
 * 错误边界处理Hook
 * 提供统一的错误处理和通知机制
 */
export function useErrorBoundaryHandler() {
  const { addNotification } = useAppStore();

  const handleErrorBoundary = useCallback(
    (error: Error, errorInfo: ErrorInfo) => {
      // 记录错误到控制台（开发环境）
      if (import.meta.env.DEV) {
        console.error('Error Boundary caught an error:', error);
        console.error('Component stack:', errorInfo.componentStack);
      }

      // 发送错误通知
      addNotification({
        type: 'error',
        title: '应用程序错误',
        message: import.meta.env.DEV 
          ? `${error.message}\n${errorInfo.componentStack.split('\n')[0]}` 
          : '应用程序遇到意外错误，请刷新页面重试',
      });

      // TODO: 在生产环境中，可以考虑发送错误报告到监控服务
      // if (import.meta.env.PROD) {
      //   sendErrorReport(error, errorInfo);
      // }
    },
    [addNotification]
  );

  return {
    handleErrorBoundary,
  };
}