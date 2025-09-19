// React Query Mutation Hooks
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { IpcError } from '@/shared/api/client';

/**
 * 统一的 API Mutation Hook
 */
export function useApiMutation<TData, TVariables = void, TError = IpcError>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) {
  return useMutation({
    mutationFn,
    retry: (failureCount, error) => {
      // 认证错误不重试
      if (error instanceof IpcError && error.isAuthError()) {
        return false;
      }
      // 网络错误重试1次
      if (error instanceof IpcError && error.isNetworkError()) {
        return failureCount < 1;
      }
      // 其他错误不重试
      return false;
    },
    ...options,
  });
}

/**
 * 创建操作 Mutation Hook
 */
export function useCreateMutation<TData, TVariables, TError = IpcError>(
  createFn: (data: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) {
  return useApiMutation(createFn, options);
}

/**
 * 更新操作 Mutation Hook
 */
export function useUpdateMutation<TData, TVariables, TError = IpcError>(
  updateFn: (data: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) {
  return useApiMutation(updateFn, options);
}

/**
 * 删除操作 Mutation Hook
 */
export function useDeleteMutation<
  TData = void,
  TVariables = string,
  TError = IpcError,
>(
  deleteFn: (id: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) {
  return useApiMutation(deleteFn, options);
}

/**
 * 批量操作 Mutation Hook
 */
export function useBatchMutation<TData, TVariables, TError = IpcError>(
  batchFn: (data: TVariables[]) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables[]>, 'mutationFn'>
) {
  return useApiMutation(batchFn, options);
}
