import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/**
 * 应用程序主布局组件
 * 包含侧边栏、头部和主内容区域
 */
export function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <Sidebar />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden ml-20">
        {/* 头部 */}
        <Header />
        
        {/* 主内容 */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}