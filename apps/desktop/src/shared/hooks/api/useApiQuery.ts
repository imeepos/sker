// React Query API Hooks
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { IpcError } from '@/shared/api/client';

/**
 * 统一的 API Query Hook
 */
export function useApiQuery<TData, TError = IpcError>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn,
    retry: (failureCount, error) => {
      // 认证错误不重试
      if (error instanceof IpcError && error.isAuthError()) {
        return false;
      }
      // 最多重试2次
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 分钟
    gcTime: 10 * 60 * 1000, // 10 分钟 (原 cacheTime)
    refetchOnWindowFocus: false,
    ...options,
  });
}

/**
 * 无限查询 Hook
 */
export function useApiInfiniteQuery<TData, TError = IpcError>(
  queryKey: unknown[],
  queryFn: ({ pageParam }: { pageParam: number }) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn: () => queryFn({ pageParam: 1 }),
    retry: (failureCount, error) => {
      if (error instanceof IpcError && error.isAuthError()) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 2 * 60 * 1000, // 2 分钟
    gcTime: 5 * 60 * 1000, // 5 分钟
    ...options,
  });
}
