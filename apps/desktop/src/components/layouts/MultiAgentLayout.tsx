/**
 * 多Agent协同开发系统 - 扩展三栏布局
 * 基于现有的ThreeColumnLayout，扩展支持多Agent功能
 */

import { useState, useCallback, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { ConversationList } from '../chat-pro/ConversationList'
import { ChatContent } from '../chat-pro/ChatContent'
import { ChatProEvent } from '../chat-pro/index'
import type { NavigationItem as BaseNavigationItem, Conversation } from '../chat-pro/ThreeColumnLayout'
import type { 
  MultiAgentNavigationItem,
  Agent,
  Project,
  Task,
  Conflict
} from '../../types/multi-agent'
import { 
  useCurrentView,
  useSelectedAgent,
  useSelectedProject,
  useSelectedTask,
  // useSelectedConflict,
  useMultiAgentStore
} from '../../stores/multiAgent'
import { 
  MessageSquare, 
  Bot, 
  FolderOpen, 
  CheckSquare, 
  AlertTriangle, 
  Calendar, 
  Cloud, 
  Table, 
  Video, 
  Briefcase, 
  Users, 
  Users2, 
  Settings 
} from 'lucide-react'

// ============================================================================
// 组件导入 - 多Agent功能组件
// ============================================================================

// Agent管理组件
import { AgentList } from '../multi-agent/Agent/AgentList'
import { AgentDetails } from '../multi-agent/Agent/AgentDetails'

// 项目管理组件  
import { ProjectList } from '../multi-agent/Project/ProjectList'
import { ProjectDetails } from '../multi-agent/Project/ProjectDetails'

// 任务监控组件
import { TaskList } from '../multi-agent/Task/TaskList'
import { TaskDetails } from '../multi-agent/Task/TaskDetails'

// 冲突处理组件 (临时注释，组件正在开发中)
// import { ConflictList } from '../multi-agent/Conflict/ConflictList'
// import { ConflictDetails } from '../multi-agent/Conflict/ConflictDetails'

// ============================================================================
// 扩展的导航项类型
// ============================================================================

// 扩展导航项类型，包含原有功能和新的多Agent功能
export type ExtendedNavigationItem = BaseNavigationItem | 'agents' | 'projects' | 'tasks' | 'conflicts'

// ============================================================================
// 接口定义
// ============================================================================

interface MultiAgentLayoutProps {
  /** 自定义样式类名 */
  className?: string
  /** 初始选中的导航项 */
  defaultNavigation?: ExtendedNavigationItem
  /** 初始选中的对话ID */
  defaultConversationId?: string
  
  // ========== 现有聊天功能props ==========
  /** 对话列表 */
  conversations?: Conversation[]
  /** 当前会话的事件列表 */
  events?: ChatProEvent[]
  /** 是否正在处理中 */
  isProcessing?: boolean
  
  // ========== 多Agent功能props ==========
  /** Agent列表 */
  agents?: Agent[]
  /** 项目列表 */
  projects?: Project[]
  /** 任务列表 */
  tasks?: Task[]
  /** 冲突列表 */
  conflicts?: Conflict[]
  
  // ========== 回调函数 ==========
  /** 导航切换回调 */
  onNavigationChange?: (item: ExtendedNavigationItem) => void
  /** 对话选择回调 */
  onConversationSelect?: (conversationId: string) => void
  /** 发送消息回调 */
  onSendMessage?: (message: string, attachments?: File[]) => void
  /** 停止处理回调 */
  onStopProcessing?: () => void
  /** 清除会话回调 */
  onClearChat?: () => void
  /** 创建新对话回调 */
  onCreateConversation?: () => void
  /** 删除对话回调 */
  onDeleteConversation?: (conversationId: string) => void
  
  // ========== 多Agent回调函数 ==========
  /** Agent选择回调 */
  onAgentSelect?: (agentId: string) => void
  /** 项目选择回调 */
  onProjectSelect?: (projectId: string) => void
  /** 任务选择回调 */
  onTaskSelect?: (taskId: string) => void
  /** 冲突选择回调 */
  onConflictSelect?: (conflictId: string) => void
  
  // ========== Agent操作回调 ==========
  onCreateAgent?: () => void
  onEditAgent?: (agent: Agent) => void
  onDeleteAgent?: (agentId: string) => void
  
  // ========== 项目操作回调 ==========
  onCreateProject?: () => void
  onEditProject?: (project: Project) => void
  onDeleteProject?: (projectId: string) => void
  
  // ========== 任务操作回调 ==========
  onCreateTask?: () => void
  onAssignTask?: (taskId: string, agentId: string) => void
  onUpdateTaskStatus?: (taskId: string, status: Task['status']) => void
  
  // ========== 冲突操作回调 ==========
  onResolveConflict?: (conflictId: string) => void
  onEscalateConflict?: (conflictId: string) => void
}

// ============================================================================
// 扩展的LeftSidebar组件
// ============================================================================

interface ExtendedLeftSidebarProps {
  selectedItem: ExtendedNavigationItem
  onItemSelect: (item: ExtendedNavigationItem) => void
  className?: string
}

function ExtendedLeftSidebar({ selectedItem, onItemSelect, className }: ExtendedLeftSidebarProps) {
  // 扩展导航项配置，包含多Agent功能
  const extendedNavigationItems = [
    {
      key: 'messages' as ExtendedNavigationItem,
      icon: MessageSquare,
      label: '消息',
      badge: 3
    },
    {
      key: 'agents' as ExtendedNavigationItem,
      icon: Bot,
      label: 'Agent',
    },
    {
      key: 'projects' as ExtendedNavigationItem,
      icon: FolderOpen,
      label: '项目',
    },
    {
      key: 'tasks' as ExtendedNavigationItem,
      icon: CheckSquare,
      label: '任务',
    },
    {
      key: 'conflicts' as ExtendedNavigationItem,
      icon: AlertTriangle,
      label: '冲突',
    },
    {
      key: 'calendar' as ExtendedNavigationItem,
      icon: Calendar,
      label: '日历'
    },
    {
      key: 'cloud-docs' as ExtendedNavigationItem,
      icon: Cloud,
      label: '云文档'
    },
    {
      key: 'tables' as ExtendedNavigationItem,
      icon: Table,
      label: '表格'
    },
    {
      key: 'video-meeting' as ExtendedNavigationItem,
      icon: Video,
      label: '会议'
    },
    {
      key: 'workbench' as ExtendedNavigationItem,
      icon: Briefcase,
      label: '工作台'
    },
    {
      key: 'contacts' as ExtendedNavigationItem,
      icon: Users,
      label: '通讯录'
    },
    {
      key: 'ai-assistant' as ExtendedNavigationItem,
      icon: Bot,
      label: 'AI助手'
    },
    {
      key: 'community' as ExtendedNavigationItem,
      icon: Users2,
      label: '社区'
    },
    {
      key: 'settings' as ExtendedNavigationItem,
      icon: Settings,
      label: '设置'
    }
  ]

  const handleItemClick = useCallback((item: ExtendedNavigationItem) => {
    onItemSelect(item)
  }, [onItemSelect])

  return (
    <div className={cn('h-full flex flex-col py-4', className)}>
      <div className="px-2 space-y-1 pb-2 pt-1 overflow-y-auto flex-1">
        {extendedNavigationItems.map((item) => {
          const Icon = item.icon
          const isSelected = selectedItem === item.key
          
          return (
            <div key={item.key} className="relative">
              <button
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
              </button>
              
              {/* 未读消息徽章 */}
              {item.badge && (
                <div className="absolute -top-1 -right-1 h-5 min-w-[20px] text-xs px-1 rounded-full bg-red-500 text-white flex items-center justify-center">
                  {item.badge}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// 主要组件
// ============================================================================

/**
 * 多Agent三栏布局组件
 * 扩展现有的ThreeColumnLayout，支持多Agent协同开发功能
 */
export function MultiAgentLayout({
  className,
  defaultNavigation = 'messages',
  defaultConversationId,
  conversations = [],
  events = [],
  isProcessing = false,
  agents = [],
  projects = [],
  tasks = [],
  // conflicts = [],
  
  // 现有回调
  onNavigationChange,
  onConversationSelect,
  onSendMessage,
  onStopProcessing,
  onClearChat,
  onCreateConversation,
  onDeleteConversation,
  
  // 多Agent回调
  onAgentSelect,
  onProjectSelect,
  onTaskSelect,
  // onConflictSelect,
  onCreateAgent,
  onEditAgent,
  onDeleteAgent,
  onCreateProject,
  onEditProject,
  onCreateTask,
  onAssignTask,
  onUpdateTaskStatus
}: MultiAgentLayoutProps) {
  
  // ========== 状态管理 ==========
  
  // 使用store中的状态
  const currentView = useCurrentView()
  const selectedAgent = useSelectedAgent()
  const selectedProject = useSelectedProject()
  const selectedTask = useSelectedTask()
  // const selectedConflict = useSelectedConflict()
  
  // 本地状态
  const [selectedNavigationLocal, setSelectedNavigationLocal] = useState<ExtendedNavigationItem>(defaultNavigation)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(defaultConversationId || null)
  
  // Store actions
  const { 
    setCurrentView, 
    setSelectedAgent, 
    setSelectedProject, 
    setSelectedTask, 
    setSelectedConflict 
  } = useMultiAgentStore()
  
  // ========== 效果同步 ==========
  
  // 同步store状态和本地状态
  useEffect(() => {
    if (currentView !== selectedNavigationLocal) {
      setSelectedNavigationLocal(currentView as ExtendedNavigationItem)
    }
  }, [currentView, selectedNavigationLocal])
  
  // ========== 事件处理 ==========
  
  // 处理导航切换
  const handleNavigationChange = useCallback((item: ExtendedNavigationItem) => {
    setSelectedNavigationLocal(item)
    setCurrentView(item as MultiAgentNavigationItem)
    onNavigationChange?.(item)
    
    // 如果切换到非消息页面，清除选中的对话
    if (item !== 'messages') {
      setSelectedConversationId(null)
    }
    
    // 如果切换到多Agent功能，清除其他选择
    if (['agents', 'projects', 'tasks', 'conflicts'].includes(item)) {
      if (item !== 'agents') setSelectedAgent(null)
      if (item !== 'projects') setSelectedProject(null)
      if (item !== 'tasks') setSelectedTask(null)
      if (item !== 'conflicts') setSelectedConflict(null)
    }
  }, [onNavigationChange, setCurrentView, setSelectedAgent, setSelectedProject, setSelectedTask, setSelectedConflict])

  // 处理对话选择
  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId)
    onConversationSelect?.(conversationId)
  }, [onConversationSelect])
  
  // 处理Agent选择
  const handleAgentSelect = useCallback((agentId: string) => {
    setSelectedAgent(agentId)
    onAgentSelect?.(agentId)
  }, [setSelectedAgent, onAgentSelect])
  
  // 处理项目选择
  const handleProjectSelect = useCallback((projectId: string) => {
    setSelectedProject(projectId)
    onProjectSelect?.(projectId)
  }, [setSelectedProject, onProjectSelect])
  
  // 处理任务选择
  const handleTaskSelect = useCallback((taskId: string) => {
    setSelectedTask(taskId)
    onTaskSelect?.(taskId)
  }, [setSelectedTask, onTaskSelect])
  
  // 处理冲突选择
  // const handleConflictSelect = useCallback((conflictId: string) => {
  //   setSelectedConflict(conflictId)
  //   onConflictSelect?.(conflictId)
  // }, [setSelectedConflict, onConflictSelect])
  
  // ========== 渲染函数 ==========
  
  // 渲染中间列内容
  const renderMiddleColumn = () => {
    switch (selectedNavigationLocal) {
      case 'messages':
        return (
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
            onCreateConversation={onCreateConversation}
            onDeleteConversation={onDeleteConversation}
          />
        )
        
      case 'agents':
        return (
          <AgentList
            agents={agents}
            selectedAgentId={selectedAgent?.id || null}
            onAgentSelect={handleAgentSelect}
            onCreateAgent={onCreateAgent}
            searchPlaceholder="搜索Agent..."
          />
        )
        
      case 'projects':
        return (
          <ProjectList
            projects={projects}
            selectedProjectId={selectedProject?.id || null}
            onProjectSelect={handleProjectSelect}
            onCreateProject={onCreateProject}
            searchPlaceholder="搜索项目..."
          />
        )
        
      case 'tasks':
        return (
          <TaskList
            tasks={tasks}
            selectedTaskId={selectedTask?.id || null}
            onTaskSelect={handleTaskSelect}
            onCreateTask={onCreateTask}
            searchPlaceholder="搜索任务..."
          />
        )
        
      case 'conflicts':
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h3 className="font-medium mb-2">冲突处理</h3>
              <p className="text-sm">功能开发中...</p>
            </div>
          </div>
        )
        
      default:
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h3 className="font-medium mb-2">功能开发中</h3>
              <p className="text-sm">{getExtendedNavigationLabel(selectedNavigationLocal)} 功能即将上线</p>
            </div>
          </div>
        )
    }
  }
  
  // 渲染右侧详情内容
  const renderRightColumn = () => {
    switch (selectedNavigationLocal) {
      case 'messages':
        const selectedConversation = selectedConversationId 
          ? conversations.find(c => c.id === selectedConversationId)
          : null
          
        if (selectedConversation) {
          return (
            <ChatContent
              conversation={selectedConversation}
              events={events}
              isProcessing={isProcessing}
              onSendMessage={onSendMessage}
              onStopProcessing={onStopProcessing}
              onClearChat={onClearChat}
            />
          )
        } else {
          return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <h3 className="font-medium mb-2">选择对话</h3>
                <p className="text-sm">请从左侧列表中选择一个对话开始聊天</p>
              </div>
            </div>
          )
        }
        
      case 'agents':
        if (selectedAgent) {
          return (
            <AgentDetails
              agent={selectedAgent}
              onEdit={() => onEditAgent?.(selectedAgent)}
              onDelete={() => onDeleteAgent?.(selectedAgent.id)}
            />
          )
        } else {
          return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <h3 className="font-medium mb-2">选择Agent</h3>
                <p className="text-sm">请从左侧列表中选择一个Agent查看详情</p>
              </div>
            </div>
          )
        }
        
      case 'projects':
        if (selectedProject) {
          return (
            <ProjectDetails
              project={selectedProject}
              onEdit={() => onEditProject?.(selectedProject)}
            />
          )
        } else {
          return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <h3 className="font-medium mb-2">选择项目</h3>
                <p className="text-sm">请从左侧列表中选择一个项目查看详情</p>
              </div>
            </div>
          )
        }
        
      case 'tasks':
        if (selectedTask) {
          return (
            <TaskDetails
              task={selectedTask}
              onAssign={(agentId) => onAssignTask?.(selectedTask.id, agentId)}
              onUpdateStatus={(status) => onUpdateTaskStatus?.(selectedTask.id, status)}
            />
          )
        } else {
          return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <h3 className="font-medium mb-2">选择任务</h3>
                <p className="text-sm">请从左侧列表中选择一个任务查看详情</p>
              </div>
            </div>
          )
        }
        
      case 'conflicts':
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h3 className="font-medium mb-2">冲突处理</h3>
              <p className="text-sm">功能开发中...</p>
            </div>
          </div>
        )
        
      default:
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h3 className="font-medium mb-2">{getExtendedNavigationLabel(selectedNavigationLocal)}</h3>
              <p className="text-sm">该功能界面正在开发中</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className={cn('h-full flex bg-background overflow-hidden w-full', className)}>
      {/* 左侧功能导航栏 */}
      <div className="w-[70px] h-full border-r bg-slate-50 dark:bg-slate-900 flex-shrink-0 overflow-hidden">
        <ExtendedLeftSidebar
          selectedItem={selectedNavigationLocal}
          onItemSelect={handleNavigationChange}
        />
      </div>

      {/* 中间列表区域 */}
      <div className="w-[320px] h-full border-r bg-background flex-shrink-0 overflow-hidden">
        {renderMiddleColumn()}
      </div>

      {/* 右侧详情区域 */}
      <div className="flex-1 h-full min-w-0 overflow-hidden">
        {renderRightColumn()}
      </div>
    </div>
  )
}

// ============================================================================
// 工具函数
// ============================================================================

// 获取扩展导航项的显示标签
function getExtendedNavigationLabel(item: ExtendedNavigationItem): string {
  const labels: Record<ExtendedNavigationItem, string> = {
    'messages': '消息',
    'agents': 'Agent管理',
    'projects': '项目管理',
    'tasks': '任务监控',
    'conflicts': '冲突处理',
    'calendar': '日历',
    'cloud-docs': '云文档',
    'tables': '多维表格',
    'video-meeting': '视频会议',
    'workbench': '工作台',
    'contacts': '通讯录',
    'ai-assistant': 'AI助手',
    'community': '社区',
    'settings': '设置'
  }
  
  return labels[item] || item
}