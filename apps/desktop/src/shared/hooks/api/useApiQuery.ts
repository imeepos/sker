import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { IpcError } from '../../api/client';

/**
 * 通用API查询Hook
 * 基于TanStack Query封装，提供统一的查询状态管理
 */
export function useApiQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, IpcError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn,
    retry: (failureCount, error) => {
      // 认证错误不重试
      if (error instanceof IpcError && error.code.startsWith('AUTH_')) {
        return false;
      }
      // Token过期错误不重试
      if (error instanceof IpcError && error.code.includes('TOKEN_EXPIRED')) {
        return false;
      }
      // 其他错误最多重试2次
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据是新鲜的
    gcTime: 10 * 60 * 1000,   // 10分钟后垃圾回收
    refetchOnWindowFocus: false, // 窗口聚焦时不自动重新获取
    ...options,
  });
}