import { useCallback } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { 
  MessageSquare, 
  Calendar, 
  Cloud, 
  Table, 
  Video, 
  Briefcase, 
  Users, 
  Bot, 
  Users2, 
  Settings,
  FolderOpen 
} from 'lucide-react'
import type { NavigationItem } from './ThreeColumnLayout'

interface LeftSidebarProps {
  /** 当前选中的导航项 */
  selectedItem: NavigationItem
  /** 导航项选择回调 */
  onItemSelect: (item: NavigationItem) => void
  /** 自定义样式类名 */
  className?: string
}

// 导航项配置
const navigationItems: Array<{
  key: NavigationItem
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: number | string
}> = [
  {
    key: 'messages',
    icon: MessageSquare,
    label: '消息',
    badge: 3
  },
  {
    key: 'calendar',
    icon: Calendar,
    label: '日历'
  },
  {
    key: 'cloud-docs',
    icon: Cloud,
    label: '云文档'
  },
  {
    key: 'tables',
    icon: Table,
    label: '多维表格'
  },
  {
    key: 'video-meeting',
    icon: Video,
    label: '视频会议'
  },
  {
    key: 'workbench',
    icon: Briefcase,
    label: '工作台'
  },
  {
    key: 'contacts',
    icon: Users,
    label: '通讯录'
  },
  {
    key: 'ai-assistant',
    icon: Bot,
    label: 'AI助手'
  },
  {
    key: 'community',
    icon: Users2,
    label: '社区'
  },
  {
    key: 'project-management',
    icon: FolderOpen,
    label: '项目管理'
  },
  {
    key: 'settings',
    icon: Settings,
    label: '设置'
  }
]

/**
 * 左侧功能导航栏
 * 
 * 仿微信风格的垂直导航栏，包含各种功能入口
 */
export function LeftSidebar({
  selectedItem,
  onItemSelect,
  className
}: LeftSidebarProps) {
  
  const handleItemClick = useCallback((item: NavigationItem) => {
    onItemSelect(item)
  }, [onItemSelect])

  return (
    <div className={cn('h-full flex flex-col py-4', className)}>
      {/* 导航项列表 - 使用 ScrollArea 支持滚动 */}
      <ScrollArea className="flex-1">
        <div className="px-2 space-y-1 pb-2 pt-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isSelected = selectedItem === item.key
            
            return (
              <div key={item.key} className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full h-12 p-0 flex flex-col items-center justify-center gap-1 text-xs rounded-lg transition-all',
                    'hover:bg-slate-100 dark:hover:bg-slate-800',
                    isSelected && [
                      'bg-blue-50 dark:bg-blue-950',
                      'text-blue-600 dark:text-blue-400',
                      'border border-blue-200 dark:border-blue-800'
                    ],
                    !isSelected && 'text-slate-600 dark:text-slate-400'
                  )}
                  onClick={() => handleItemClick(item.key)}
                  title={item.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="leading-none">{item.label}</span>
                </Button>
                
                {/* 未读消息徽章 */}
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 min-w-[20px] text-xs px-1 rounded-full"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* 底部更多按钮 */}
      <div className="px-2 pt-2 border-t border-slate-200 dark:border-slate-700">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-10 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          title="更多"
        >
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-current"></div>
            <div className="w-1 h-1 rounded-full bg-current"></div>
            <div className="w-1 h-1 rounded-full bg-current"></div>
          </div>
        </Button>
      </div>
    </div>
  )
}