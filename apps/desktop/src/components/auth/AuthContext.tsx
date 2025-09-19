import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface User {
  user_id: string;
  username: string;
  email: string;
  created_at: string;
  profile_data?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
  expires_in: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化时检查本地存储的认证信息
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user_info');
        
        if (storedToken && storedUser) {
          // 验证令牌是否仍然有效
          try {
            const userInfo = await invoke<User>('validate_token', {
              token: storedToken
            });
            
            setToken(storedToken);
            setUser(userInfo);
          } catch (error) {
            // 令牌无效，清除本地存储
            console.warn('Token validation failed:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_info');
          }
        }
      } catch (error) {
        console.error('Authentication initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (authData: AuthResponse) => {
    setUser(authData.user);
    setToken(authData.token);
    
    // 存储到本地存储
    localStorage.setItem('auth_token', authData.token);
    localStorage.setItem('refresh_token', authData.refresh_token);
    localStorage.setItem('user_info', JSON.stringify(authData.user));
  };

  const logout = async () => {
    try {
      if (token) {
        await invoke('logout', { token });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // 清除状态和本地存储
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};