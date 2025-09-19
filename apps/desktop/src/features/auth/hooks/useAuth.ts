// 认证相关 Hooks
import React, { useCallback } from 'react';
import { useApiQuery, useApiMutation } from '@/shared/hooks/api';
import { useAuthStore } from '@/shared/stores/auth';
import { useAppStore } from '@/shared/stores/app';
import { useErrorHandler } from '@/shared/hooks/utils';
import { 
  authApi, 
  type LoginRequest, 
  type RegisterRequest, 
  type UpdateProfileRequest,
  type ChangePasswordRequest 
} from '../api/authApi';

/**
 * 主要认证 Hook
 */
export function useAuth() {
  const {
    isAuthenticated,
    user,
    token,
    isLoading,
    setAuth,
    setUser,
    setLoading,
    clearAuth,
  } = useAuthStore();

  const { addNotification } = useAppStore();
  const { handleError } = useErrorHandler();

  // 获取用户资料查询
  const profileQuery = useApiQuery(
    ['auth', 'profile'],
    authApi.getProfile,
    {
      enabled: isAuthenticated && !!token,
    }
  );

  // 处理查询结果
  React.useEffect(() => {
    if (profileQuery.data) {
      setUser(profileQuery.data);
    }
    if (profileQuery.error) {
      handleError(profileQuery.error);
    }
  }, [profileQuery.data, profileQuery.error, setUser, handleError]);

  // 登录 Mutation
  const loginMutation = useApiMutation(
    authApi.login,
    {
      onMutate: () => {
        setLoading(true);
      },
      onSuccess: (data) => {
        setAuth(data.token, data.user);
        addNotification({
          type: 'success',
          title: '登录成功',
          message: `欢迎回来，${data.user.name}！`,
        });
      },
      onError: (error) => {
        handleError(error, {
          customMessage: '登录失败，请检查用户名和密码',
        });
      },
      onSettled: () => {
        setLoading(false);
      },
    }
  );

  // 登出 Mutation
  const logoutMutation = useApiMutation(
    authApi.logout,
    {
      onSuccess: () => {
        clearAuth();
        addNotification({
          type: 'success',
          title: '已登出',
          message: '您已成功登出',
        });
      },
      onError: (error) => {
        // 即使登出失败也清除本地状态
        clearAuth();
        handleError(error, {
          customMessage: '登出时发生错误，但已清除本地登录状态',
        });
      },
    }
  );

  // 注册 Mutation
  const registerMutation = useApiMutation(
    authApi.register,
    {
      onMutate: () => {
        setLoading(true);
      },
      onSuccess: (data) => {
        setAuth(data.token, data.user);
        addNotification({
          type: 'success',
          title: '注册成功',
          message: `欢迎加入，${data.user.name}！`,
        });
      },
      onError: (error) => {
        handleError(error, {
          customMessage: '注册失败，请稍后重试',
        });
      },
      onSettled: () => {
        setLoading(false);
      },
    }
  );

  // 更新资料 Mutation
  const updateProfileMutation = useApiMutation(
    authApi.updateProfile,
    {
      onSuccess: (data) => {
        setUser(data);
        addNotification({
          type: 'success',
          title: '资料已更新',
        });
      },
      onError: (error) => {
        handleError(error, {
          customMessage: '更新资料失败',
        });
      },
    }
  );

  // 修改密码 Mutation
  const changePasswordMutation = useApiMutation(
    authApi.changePassword,
    {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: '密码已修改',
          message: '您的密码已成功修改',
        });
      },
      onError: (error) => {
        handleError(error, {
          customMessage: '修改密码失败',
        });
      },
    }
  );

  // 刷新令牌 Mutation
  const refreshTokenMutation = useApiMutation(
    authApi.refreshToken,
    {
      onSuccess: (data) => {
        // 更新 token，保持用户信息不变
        if (user) {
          setAuth(data.token, user);
        }
      },
      onError: (error) => {
        // 刷新令牌失败，清除认证状态
        clearAuth();
        handleError(error, {
          customMessage: '登录已过期，请重新登录',
        });
      },
    }
  );

  // 登录函数
  const login = useCallback(
    (credentials: LoginRequest) => {
      loginMutation.mutate(credentials);
    },
    [loginMutation]
  );

  // 登出函数
  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  // 注册函数
  const register = useCallback(
    (registerData: RegisterRequest) => {
      registerMutation.mutate(registerData);
    },
    [registerMutation]
  );

  // 更新资料函数
  const updateProfile = useCallback(
    (updates: UpdateProfileRequest) => {
      updateProfileMutation.mutate(updates);
    },
    [updateProfileMutation]
  );

  // 修改密码函数
  const changePassword = useCallback(
    (passwordData: ChangePasswordRequest) => {
      changePasswordMutation.mutate(passwordData);
    },
    [changePasswordMutation]
  );

  // 刷新令牌函数
  const refreshToken = useCallback(() => {
    refreshTokenMutation.mutate();
  }, [refreshTokenMutation]);

  return {
    // 状态
    user,
    isAuthenticated,
    isLoading: isLoading || profileQuery.isLoading,
    error: 
      profileQuery.error ||
      loginMutation.error ||
      logoutMutation.error ||
      registerMutation.error ||
      updateProfileMutation.error ||
      changePasswordMutation.error,

    // 操作
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    refreshToken,

    // 加载状态
    isLoginPending: loginMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isUpdateProfilePending: updateProfileMutation.isPending,
    isChangePasswordPending: changePasswordMutation.isPending,
    isRefreshTokenPending: refreshTokenMutation.isPending,

    // 重置函数
    resetLoginError: loginMutation.reset,
    resetRegisterError: registerMutation.reset,
  };
}

/**
 * 密码重置相关 Hook
 */
export function usePasswordReset() {
  const { handleError } = useErrorHandler();
  const { addNotification } = useAppStore();

  // 发送重置邮件 Mutation
  const sendResetEmailMutation = useApiMutation(
    authApi.sendPasswordReset,
    {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: '重置邮件已发送',
          message: '请检查您的邮箱并按照指示重置密码',
        });
      },
      onError: (error) => {
        handleError(error, {
          customMessage: '发送重置邮件失败',
        });
      },
    }
  );

  // 重置密码 Mutation
  const resetPasswordMutation = useApiMutation(
    ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
    {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: '密码重置成功',
          message: '您可以使用新密码登录了',
        });
      },
      onError: (error) => {
        handleError(error, {
          customMessage: '密码重置失败',
        });
      },
    }
  );

  return {
    sendResetEmail: (email: string) => sendResetEmailMutation.mutate(email),
    resetPassword: (token: string, newPassword: string) =>
      resetPasswordMutation.mutate({ token, newPassword }),
    
    isSendingEmail: sendResetEmailMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    
    error: sendResetEmailMutation.error || resetPasswordMutation.error,
  };
}