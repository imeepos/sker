// 全局 Providers 配置
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { IpcError } from '@/shared/api/client';
import { useAppStore } from '@/shared/stores/app';
import { useAuthStore } from '@/shared/stores/auth';
import { ErrorBoundary } from '@/shared/components/common';
import { useErrorBoundaryHandler } from '@/shared/hooks/utils';

/**
 * 创建 QueryClient 实例
 */
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 错误重试策略
        retry: (failureCount, error) => {
          // 认证错误不重试
          if (error instanceof IpcError && error.isAuthError()) {
            return false;
          }
          // 最多重试 2 次
          return failureCount < 2;
        },
        // 缓存配置
        staleTime: 5 * 60 * 1000, // 5 分钟
        gcTime: 10 * 60 * 1000, // 10 分钟
        // UI 配置
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        // 变更重试策略
        retry: (failureCount, error) => {
          // 认证错误不重试
          if (error instanceof IpcError && error.isAuthError()) {
            return false;
          }
          // 网络错误重试 1 次
          if (error instanceof IpcError && error.isNetworkError()) {
            return failureCount < 1;
          }
          // 其他错误不重试
          return false;
        },
        // 全局错误处理
        onError: (error) => {
          console.error('Mutation error:', error);
          
          // 添加错误通知
          const { addNotification } = useAppStore.getState();
          if (error instanceof IpcError) {
            // 认证错误特殊处理
            if (error.isAuthError()) {
              addNotification({
                type: 'error',
                title: '认证失败',
                message: '请重新登录',
              });
              // 清除认证状态
              useAuthStore.getState().clearAuth();
            } else {
              addNotification({
                type: 'error',
                title: '操作失败',
                message: error.message,
              });
            }
          } else {
            addNotification({
              type: 'error',
              title: '系统错误',
              message: '发生未知错误，请稍后重试',
            });
          }
        },
      },
    },
  });
};

// 全局 QueryClient 实例
const queryClient = createQueryClient();

/**
 * React Query Provider
 */
interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 开发环境下显示 DevTools */}
      {typeof window !== 'undefined' && import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}

/**
 * 主题 Provider（暂时占位，后续可扩展）
 */
interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}

/**
 * 错误边界包装器
 */
function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  const { handleErrorBoundary } = useErrorBoundaryHandler();

  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      handleErrorBoundary(error, {
        componentStack: errorInfo.componentStack || ''
      });
    }}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * 所有 Providers 的组合
 */
interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundaryWrapper>
      <QueryProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundaryWrapper>
  );
}

// 导出 queryClient 实例供其他地方使用
export { queryClient };