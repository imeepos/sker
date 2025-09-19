import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card } from '../ui/card';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    user_id: string;
    username: string;
    email: string;
    created_at: string;
    profile_data?: any;
  };
  token: string;
  refresh_token: string;
  expires_in: number;
}

interface LoginPageProps {
  onAuthSuccess: (authData: AuthResponse) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 登录表单状态
  const [loginForm, setLoginForm] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  
  // 注册表单状态
  const [registerForm, setRegisterForm] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await invoke<AuthResponse>('login', {
        request: loginForm
      });
      
      // 存储认证信息到localStorage
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user_info', JSON.stringify(response.user));
      
      onAuthSuccess(response);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await invoke<AuthResponse>('register', {
        request: registerForm
      });
      
      // 存储认证信息到localStorage
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user_info', JSON.stringify(response.user));
      
      onAuthSuccess(response);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const updateLoginForm = (field: keyof LoginRequest, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  const updateRegisterForm = (field: keyof RegisterRequest, value: string) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isLogin ? '登录' : '注册'} Sker
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isLogin ? '欢迎回来！请登录您的账户' : '创建新账户开始使用'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <div className="text-red-800 dark:text-red-400 text-sm">{error}</div>
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) => updateLoginForm('email', e.target.value)}
                placeholder="请输入邮箱地址"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => updateLoginForm('password', e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                value={registerForm.username}
                onChange={(e) => updateRegisterForm('username', e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="register-email">邮箱</Label>
              <Input
                id="register-email"
                type="email"
                value={registerForm.email}
                onChange={(e) => updateRegisterForm('email', e.target.value)}
                placeholder="请输入邮箱地址"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="register-password">密码</Label>
              <Input
                id="register-password"
                type="password"
                value={registerForm.password}
                onChange={(e) => updateRegisterForm('password', e.target.value)}
                placeholder="请输入密码（至少6位）"
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>
        )}

        <Separator />

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            {isLogin ? '没有账户？点击注册' : '已有账户？点击登录'}
          </button>
        </div>
      </Card>
    </div>
  );
};