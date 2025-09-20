import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { useValidateToken } from '../../hooks/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 路由保护组件
 * 检查用户认证状态，未登录用户重定向到登录页
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, token } = useAuthStore();
  
  // 始终调用 useValidateToken hook，确保 hooks 调用顺序一致
  const { 
    isLoading: isValidating, 
    error: validateError 
  } = useValidateToken(token || undefined);

  // 检查基本认证状态（token过期检查已在store中处理）
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Token验证中显示loading状态
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在验证登录状态...</p>
        </div>
      </div>
    );
  }

  // Token验证失败，重定向到登录页
  if (validateError) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 验证通过，显示受保护的内容
  return <>{children}</>;
}