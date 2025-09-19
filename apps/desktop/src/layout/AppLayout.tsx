import { useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { LeftSidebar } from '../components/chat-pro/LeftSidebar'
import { ConversationList } from '../components/chat-pro/ConversationList'
import { AgentsSidebar } from './AgentsSidebar'

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

export interface Conversation {
  id: string
  title: string
  lastMessage?: string
  timestamp: Date
  unreadCount?: number
  avatar?: string
  isGroup?: boolean
  isStarred?: boolean
  status?: 'online' | 'offline' | 'away'
}

interface AppLayoutProps {
  /** 自定义样式类名 */
  className?: string
  /** 对话列表 */
  conversations?: Conversation[]
  /** 创建新对话回调 */
  onCreateConversation?: () => void
  /** 删除对话回调 */
  onDeleteConversation?: (conversationId: string) => void
  /** 创建Agent回调 */
  onCreateAgent?: () => void
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
 * 应用主布局 - 支持路由的三栏布局
 * 
 * 布局结构：
 * - 左侧：功能导航栏 (70px)
 * - 中间：对话列表或功能侧边栏 (320px) - 根据路由显示不同内容
 * - 右侧：主要内容区域 (剩余空间) - 通过 Outlet 渲染路由组件
 */
export function AppLayout({
  className,
  conversations = [],
  onCreateConversation,
  onDeleteConversation,
  onCreateAgent
}: AppLayoutProps) {
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
  
  // 从 URL 中获取当前选中的对话 ID
  const getSelectedConversationId = (): string | null => {
    const match = location.pathname.match(/^\/messages\/(.+)$/)
    return match ? match[1] : null
  }

  const selectedConversationId = getSelectedConversationId()

  // 处理导航切换
  const handleNavigationChange = useCallback((item: NavigationItem) => {
    const route = navigationRouteMap[item]
    navigate(route)
  }, [navigate])

  // 处理对话选择
  const handleConversationSelect = useCallback((conversationId: string) => {
    navigate(`/messages/${conversationId}`)
  }, [navigate])

  // 判断中间栏显示的内容类型
  const getSidebarContent = () => {
    if (selectedNavigation === 'messages') {
      return 'conversations'
    } else if (selectedNavigation === 'agents') {
      return 'agents'
    } else {
      return 'default'
    }
  }

  const sidebarContent = getSidebarContent()

  return (
    <div className={cn('h-full flex bg-background overflow-hidden w-full', className)}>
      {/* 左侧功能导航栏 */}
      <div className="w-[70px] h-full border-r bg-slate-50 dark:bg-slate-900 flex-shrink-0 overflow-hidden">
        <LeftSidebar
          selectedItem={selectedNavigation}
          onItemSelect={handleNavigationChange}
        />
      </div>

      {/* 中间对话列表或功能区域 */}
      <div className="w-[320px] h-full border-r bg-background flex-shrink-0 overflow-hidden">
        {sidebarContent === 'conversations' ? (
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
            onCreateConversation={onCreateConversation}
            onDeleteConversation={onDeleteConversation}
          />
        ) : sidebarContent === 'agents' ? (
          <AgentsSidebar
            onCreateAgent={onCreateAgent}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h3 className="font-medium mb-2">{getNavigationLabel(selectedNavigation)}</h3>
              <p className="text-sm">
                {selectedNavigation === 'project-management' ? 
                  '请在右侧查看项目管理界面' : 
                  '功能即将上线'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 右侧内容区域 - 通过路由渲染 */}
      <div className="flex-1 h-full min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}

// 获取导航项的显示标签
function getNavigationLabel(item: NavigationItem): string {
  const labels: Record<NavigationItem, string> = {
    'messages': '消息',
    'calendar': '日历',
    'cloud-docs': '云文档',
    'tables': '多维表格',
    'video-meeting': '视频会议',
    'workbench': '工作台',
    'contacts': '通讯录',
    'ai-assistant': 'AI助手',
    'community': '社区',
    'project-management': '项目管理',
    'agents': 'Agent管理',
    'settings': '设置'
  }
  
  return labels[item] || item
}