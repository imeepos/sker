import { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { LeftSidebar } from '../components/chat-pro/LeftSidebar'
import { useLocation, useNavigate } from 'react-router-dom'

export type NavigationItem = 
  | 'messages' 
  | 'calendar' 
  | 'cloud-docs' 
  | 'tables' 
  | 'video-meeting' 
  | 'workbench' 
  | 'contacts' 
  | 'ai-assistant' 
  | 'community' 
  | 'project-management'
  | 'agents'
  | 'settings'

interface BaseLayoutProps {
  /** 自定义样式类名 */
  className?: string
  /** 是否显示左侧导航栏 */
  showNavigation?: boolean
  /** 中间侧边栏内容 */
  sidebar?: ReactNode
  /** 主要内容 */
  children: ReactNode
}

// 导航项到路由的映射
const navigationRouteMap: Record<NavigationItem, string> = {
  'messages': '/messages',
  'calendar': '/calendar',
  'cloud-docs': '/cloud-docs',
  'tables': '/tables',
  'video-meeting': '/video-meeting',
  'workbench': '/workbench',
  'contacts': '/contacts',
  'ai-assistant': '/ai-assistant',
  'community': '/community',
  'project-management': '/project-management',
  'agents': '/agents',
  'settings': '/settings'
}

// 路由到导航项的映射
const routeNavigationMap: Record<string, NavigationItem> = Object.fromEntries(
  Object.entries(navigationRouteMap).map(([nav, route]) => [route, nav as NavigationItem])
)

/**
 * 基础布局组件 - 提供灵活的布局方案
 * 
 * 布局特点：
 * - 可选的左侧导航栏
 * - 可选的中间侧边栏
 * - 自适应的主内容区域
 */
export function BaseLayout({
  className,
  showNavigation = true,
  sidebar,
  children
}: BaseLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  
  // 根据当前路由确定选中的导航项
  const getCurrentNavigation = (): NavigationItem => {
    const currentRoute = location.pathname
    
    // 精确匹配
    if (routeNavigationMap[currentRoute]) {
      return routeNavigationMap[currentRoute]
    }
    
    // 部分匹配（处理子路由）
    for (const [route, nav] of Object.entries(routeNavigationMap)) {
      if (currentRoute.startsWith(route)) {
        return nav
      }
    }
    
    // 默认返回消息
    return 'messages'
  }

  const selectedNavigation = getCurrentNavigation()

  // 处理导航切换
  const handleNavigationChange = (item: NavigationItem) => {
    const route = navigationRouteMap[item]
    navigate(route)
  }

  return (
    <div className={cn('h-full flex bg-background overflow-hidden w-full', className)}>
      {/* 左侧功能导航栏 - 可选 */}
      {showNavigation && (
        <div className="w-[70px] h-full border-r bg-slate-50 dark:bg-slate-900 flex-shrink-0 overflow-hidden">
          <LeftSidebar
            selectedItem={selectedNavigation}
            onItemSelect={handleNavigationChange}
          />
        </div>
      )}

      {/* 中间侧边栏 - 可选 */}
      {sidebar && (
        <div className="w-[320px] h-full border-r bg-background flex-shrink-0 overflow-hidden">
          {sidebar}
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="flex-1 h-full min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}