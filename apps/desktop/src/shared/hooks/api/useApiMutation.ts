import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { IpcError } from '../../api/client';

/**
 * 通用API变更Hook
 * 基于TanStack Query封装，提供统一的变更状态管理
 */
export function useApiMutation<T, V = void>(
  mutationFn: (variables: V) => Promise<T>,
  options?: Omit<UseMutationOptions<T, IpcError, V>, 'mutationFn'>
) {
  return useMutation({
    mutationFn,
    retry: (failureCount, error) => {
      // 认证错误不重试
      if (error instanceof IpcError && error.code.startsWith('AUTH_')) {
        return false;
      }
      // Token过期错误不重试  
      if (error instanceof IpcError && error.code.includes('TOKEN_EXPIRED')) {
        return false;
      }
      // 网络错误重试1次
      if (error instanceof IpcError && error.code.includes('NETWORK')) {
        return failureCount < 1;
      }
      // 其他错误不重试
      return false;
    },
    retryDelay: 1000,
    ...options,
  });
}