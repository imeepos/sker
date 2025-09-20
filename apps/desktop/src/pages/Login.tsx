import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth, useLogin, useRegister } from '../shared/hooks/api';
import { useAuthStore } from '../shared/stores/auth';
import { credentialsApi } from '../shared/api/credentials';
import type { LoginRequest, RegisterRequest } from '../shared/types/auth';

/**
 * 登录/注册页面
 * 提供用户认证功能
 */
export function Login() {
  const { isAuthenticated, isTokenExpired } = useAuthStore();
  const { 
    isLoading, 
    error, 
    clearError
  } = useAuth();
  
  // 单独使用login和register hooks来处理成功回调
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });

  // 组件加载时检查token是否过期（会自动清除过期状态）
  React.useEffect(() => {
    isTokenExpired();
  }, [isTokenExpired]);

  // 组件加载时尝试加载保存的凭据
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedCredentials = await credentialsApi.getSavedCredentials();
        if (savedCredentials && !isRegisterMode) {
          setFormData(prev => ({
            ...prev,
            email: savedCredentials.email,
            password: savedCredentials.password,
          }));
          setRememberPassword(savedCredentials.remember);
        }
      } catch (error) {
        console.error('加载保存的凭据失败:', error);
      }
    };

    loadSavedCredentials();
  }, [isRegisterMode]);

  // 如果已经登录且token未过期，直接重定向到工作台
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    loginMutation.reset();
    registerMutation.reset();

    if (isRegisterMode) {
      const registerData: RegisterRequest = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
      };
      registerMutation.mutate(registerData);
    } else {
      const loginData: LoginRequest = {
        email: formData.email,
        password: formData.password,
      };
      
      // 调用登录功能，设置成功回调来保存凭据
      loginMutation.mutate(loginData, {
        onSuccess: async () => {
          // 登录成功后保存凭据（如果用户选择记住密码）
          try {
            await credentialsApi.saveCredentials({
              email: formData.email,
              password: formData.password,
              remember: rememberPassword,
            });
          } catch (credError) {
            console.error('保存凭据失败:', credError);
            // 凭据保存失败不影响登录流程
          }
        },
      });
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 切换登录/注册模式
  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    clearError();
    loginMutation.reset();
    registerMutation.reset();
    setRememberPassword(false);
    setFormData({
      email: '',
      password: '',
      username: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {isRegisterMode ? '创建账户' : '登录到 Codex'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isRegisterMode ? '开始你的多智能体协同开发之旅' : '多智能体协同开发系统'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 姓名输入 - 仅注册模式显示 */}
            {isRegisterMode && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  用户名
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required={isRegisterMode}
                    value={formData.username}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="请输入您的用户名"
                  />
                </div>
              </div>
            )}

            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱地址
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="请输入您的邮箱地址"
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={isRegisterMode ? '请设置密码（至少8位）' : '请输入您的密码'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* 记住密码选项 - 仅登录模式显示 */}
            {!isRegisterMode && (
              <div className="flex items-center">
                <input
                  id="remember-password"
                  name="remember-password"
                  type="checkbox"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-password" className="ml-2 block text-sm text-gray-700">
                  记住密码
                </label>
              </div>
            )}

            {/* 错误信息 */}
            {(error || loginMutation.error || registerMutation.error) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">
                  {error ? (error instanceof Error ? error.message : String(error)) :
                   loginMutation.error ? (loginMutation.error instanceof Error ? loginMutation.error.message : String(loginMutation.error)) :
                   registerMutation.error ? (registerMutation.error instanceof Error ? registerMutation.error.message : String(registerMutation.error)) : ''}
                </p>
              </div>
            )}

            {/* 提交按钮 */}
            <div>
              <button
                type="submit"
                disabled={isLoading || loginMutation.isPending || registerMutation.isPending}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(isLoading || loginMutation.isPending || registerMutation.isPending) ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isRegisterMode ? '注册中...' : '登录中...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    {isRegisterMode ? (
                      <UserPlus className="h-4 w-4 mr-2" />
                    ) : (
                      <LogIn className="h-4 w-4 mr-2" />
                    )}
                    {isRegisterMode ? '创建账户' : '登录'}
                  </div>
                )}
              </button>
            </div>

            {/* 切换登录/注册模式 */}
            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {isRegisterMode ? '已有账户？立即登录' : '没有账户？立即注册'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}