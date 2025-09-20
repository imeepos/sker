import { NavLink, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { MAIN_MENU_ITEMS } from '../../constants/menu';
import { useAuth } from '../../hooks/api';
import { useAuthStore } from '../../stores/auth';

/**
 * 侧边栏组件
 * 显示主导航菜单
 */
export function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { logout, isLogoutPending } = useAuth();

  const handleLogout = () => {
    // 防止重复点击
    if (isLogoutPending) return;
    logout();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 w-20 h-screen bg-white border-r border-gray-200">
      <div className="h-full px-3 py-4 overflow-y-auto">
        {/* Navigation */}
        <nav className="space-y-2">
          {MAIN_MENU_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={`relative flex items-center justify-center p-2 text-base font-normal rounded-lg transition-colors hover:bg-gray-100 ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-900'
                }`}
                title={item.title}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                {item.badge && (
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                    typeof item.badge === 'number' && item.badge > 0
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`} />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="absolute bottom-4 left-3 right-3 space-y-2">
          {/* User Profile */}
          <div className="flex items-center justify-center p-2 rounded-lg bg-gray-50" title={user?.username || '当前用户'}>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="退出登录"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}