import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Bell, Search, User, Settings, LogOut } from 'lucide-react';
import { getMenuTitle } from '../../constants/menu';
import { useAuthStore } from '../../stores/auth';

/**
 * 头部组件
 * 显示面包屑导航和用户操作
 */
export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getMenuTitle(location.pathname);
  const { user, clearAuth } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 面包屑导航 */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Codex</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{pageTitle}</span>
        </div>

        {/* 右侧操作 */}
        <div className="flex items-center space-x-4">
          {/* 搜索 */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="搜索..."
            />
          </div>

          {/* 通知 */}
          <button className="p-2 text-gray-400 hover:text-gray-500 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
          </button>

          {/* 用户头像和菜单 */}
          <div className="relative" ref={menuRef}>
            <button 
              className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="sr-only">打开用户菜单</span>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </button>

            {/* 用户下拉菜单 */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/profile');
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="w-4 h-4 mr-2" />
                  个人中心
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  系统设置
                </button>
                
                <hr className="my-1" />
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    clearAuth();
                    navigate('/login');
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}