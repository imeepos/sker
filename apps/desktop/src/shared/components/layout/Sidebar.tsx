import { NavLink, useLocation } from 'react-router-dom';
import { MAIN_MENU_ITEMS } from '../../constants/menu';

/**
 * 侧边栏组件
 * 显示主导航菜单
 */
export function Sidebar() {
  const location = useLocation();
  return (
    <aside className='fixed left-0 top-0 z-40 h-screen w-20 border-r border-gray-200 bg-white'>
      <div className='h-full overflow-y-auto px-3 py-4'>
        {/* Navigation */}
        <nav className='space-y-2'>
          {MAIN_MENU_ITEMS.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={`relative flex items-center justify-center rounded-lg p-2 text-base font-normal transition-colors hover:bg-gray-100 ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-900'
                }`}
                title={item.title}
              >
                <Icon className='h-6 w-6 flex-shrink-0' />
                {item.badge && (
                  <span
                    className={`absolute -right-1 -top-1 h-3 w-3 rounded-full ${
                      typeof item.badge === 'number' && item.badge > 0
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
