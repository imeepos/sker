import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from './';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../stores/auth';
import type { LoginRequest, RegisterRequest, ChangePasswordRequest, UpdateUserRequest } from '../../types/auth';

/**
 * 认证相关的React Query hooks
 * 提供缓存、重试、后台更新等功能
 */

// 查询keys定义
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'currentUser'] as const,
  validateToken: (token: string) => [...authKeys.all, 'validateToken', token] as const,
};

/**
 * 获取当前用户信息的Query Hook
 */
export function useCurrentUser() {
  const { isAuthenticated, token } = useAuthStore();
  
  const query = useApiQuery(
    [...authKeys.currentUser()],
    () => {
      // 如果未认证，返回空Promise避免实际请求
      if (!isAuthenticated || !token) {
        return Promise.resolve(null);
      }
      return authApi.getCurrentUser(token);
    },
    {
      enabled: isAuthenticated && !!token,
    }
  );

  // 使用 useEffect 处理数据更新和错误
  React.useEffect(() => {
    if (query.data && query.isSuccess) {
      // 只有在获取到真实用户数据时才更新store
      useAuthStore.getState().setUser(query.data);
    }
  }, [query.data, query.isSuccess]);

  React.useEffect(() => {
    if (query.error) {
      console.error('获取用户信息失败:', query.error);
      // 使用setTimeout避免同步状态更新导致的重渲染循环
      setTimeout(() => {
        if ((query.error as any).code?.startsWith('AUTH_') || (query.error as any).code?.includes('TOKEN_EXPIRED')) {
          useAuthStore.getState().clearAuth();
        }
      }, 0);
    }
  }, [query.error]);

  return query;
}

/**
 * Token验证的Query Hook
 */
export function useValidateToken(token?: string) {
  const query = useApiQuery(
    [...authKeys.validateToken(token || '')],
    () => {
      // 如果没有token，返回失败的Promise
      if (!token) {
        return Promise.reject(new Error('No token provided'));
      }
      return authApi.validateToken(token);
    },
    {
      enabled: !!token,
      staleTime: 30 * 60 * 1000, // 30分钟内不重新验证
      retry: false, // 避免重试导致循环
    }
  );

  // 处理错误
  React.useEffect(() => {
    if (query.error) {
      console.error('Token验证失败:', query.error);
      // 使用setTimeout避免同步状态更新导致的重渲染循环
      setTimeout(() => {
        if ((query.error as any).message !== 'No token provided' && 
            ((query.error as any).code?.startsWith('AUTH_') || (query.error as any).code?.includes('TOKEN_EXPIRED'))) {
          useAuthStore.getState().clearAuth();
        }
      }, 0);
    }
  }, [query.error]);

  return query;
}

/**
 * 用户登录的Mutation Hook
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useApiMutation(
    authApi.login,
    {
      onSuccess: (response) => {
        // 设置认证状态
        setAuth(response);
        
        // 预填充用户信息缓存
        queryClient.setQueryData(authKeys.currentUser(), response.user);
        
        // 清除之前可能的错误状态
        queryClient.removeQueries({ 
          queryKey: authKeys.all,
          type: 'inactive' 
        });
      },
      onError: (error) => {
        console.error('登录失败:', error);
        // 清除可能的残留认证状态
        useAuthStore.getState().clearAuth();
      },
    }
  );
}

/**
 * 用户注册的Mutation Hook
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useApiMutation(
    authApi.register,
    {
      onSuccess: (response) => {
        // 设置认证状态
        setAuth(response);
        
        // 预填充用户信息缓存
        queryClient.setQueryData(authKeys.currentUser(), response.user);
        
        // 清除之前可能的错误状态
        queryClient.removeQueries({ 
          queryKey: authKeys.all,
          type: 'inactive' 
        });
      },
      onError: (error) => {
        console.error('注册失败:', error);
      },
    }
  );
}

/**
 * 用户登出的Mutation Hook
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const { token, clearAuth } = useAuthStore();

  return useApiMutation(
    () => authApi.logout(token!),
    {
      onSuccess: () => {
        // 清除认证状态
        clearAuth();
        
        // 清除所有查询缓存
        queryClient.clear();
      },
      onError: (error) => {
        console.error('登出失败:', error);
        // 即使登出失败也清除本地状态
        clearAuth();
        queryClient.clear();
      },
      onSettled: () => {
        // 无论成功失败都清除认证相关缓存
        queryClient.removeQueries({ queryKey: authKeys.all });
      },
    }
  );
}

/**
 * Token刷新的Mutation Hook
 */
export function useRefreshToken() {
  const queryClient = useQueryClient();
  const { refreshToken, setAuth, clearAuth } = useAuthStore();

  return useApiMutation(
    () => authApi.refreshToken(refreshToken!),
    {
      onSuccess: (response) => {
        // 更新认证状态
        setAuth(response);
        
        // 更新用户信息缓存
        queryClient.setQueryData(authKeys.currentUser(), response.user);
        
        // 重新验证所有查询
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        console.error('Token刷新失败:', error);
        // 刷新失败，清除认证状态
        clearAuth();
        queryClient.clear();
      },
    }
  );
}

/**
 * 修改密码的Mutation Hook
 */
export function useChangePassword() {
  const { token } = useAuthStore();
  
  return useApiMutation(
    (request: ChangePasswordRequest) => {
      if (!token) {
        throw new Error('用户未登录');
      }
      return authApi.changePassword(request, token);
    }
  );
}

/**
 * 更新用户信息的Mutation Hook
 */
export function useUpdateUserInfo() {
  const { token } = useAuthStore();

  return useApiMutation(
    (request: UpdateUserRequest) => {
      if (!token) {
        throw new Error('用户未登录');
      }
      return authApi.updateUserInfo(request, token);
    }
  );
}

/**
 * 组合的认证Hook，提供完整的认证功能
 */
export function useAuth() {
  // 确保所有 hooks 始终按相同顺序调用
  const authStore = useAuthStore();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const refreshMutation = useRefreshToken();
  const currentUserQuery = useCurrentUser();
  const changePasswordMutation = useChangePassword();
  const updateUserMutation = useUpdateUserInfo();

  // 使用 useMemo 确保返回对象稳定
  return {
    // 状态
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    token: authStore.token,
    
    // 加载状态
    isLoading: currentUserQuery.isLoading || 
               loginMutation.isPending || 
               registerMutation.isPending || 
               logoutMutation.isPending ||
               refreshMutation.isPending ||
               changePasswordMutation.isPending ||
               updateUserMutation.isPending,
    
    // 错误状态 - 只在认证状态下显示 currentUserQuery 错误
    error: (authStore.isAuthenticated ? currentUserQuery.error : null) || 
           loginMutation.error || 
           registerMutation.error || 
           logoutMutation.error ||
           refreshMutation.error ||
           changePasswordMutation.error ||
           updateUserMutation.error,
    
    // 操作
    login: (credentials: LoginRequest) => loginMutation.mutate(credentials),
    register: (data: RegisterRequest) => registerMutation.mutate(data),
    logout: () => logoutMutation.mutate(),
    refreshAuth: () => refreshMutation.mutate(),
    changePassword: (request: ChangePasswordRequest) => changePasswordMutation.mutateAsync(request),
    updateUserInfo: (request: UpdateUserRequest) => updateUserMutation.mutateAsync(request),
    
    // 状态操作
    clearError: () => {
      loginMutation.reset();
      registerMutation.reset();
      logoutMutation.reset();
      refreshMutation.reset();
      changePasswordMutation.reset();
      updateUserMutation.reset();
    },
    
    // 便捷访问
    userId: authStore.user?.user_id,
    userName: authStore.user?.username,
    userEmail: authStore.user?.email,
    
    // 查询状态
    isUserLoading: currentUserQuery.isLoading,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    isRefreshPending: refreshMutation.isPending,
    isChangePasswordPending: changePasswordMutation.isPending,
    isUpdateUserPending: updateUserMutation.isPending,
  };
}