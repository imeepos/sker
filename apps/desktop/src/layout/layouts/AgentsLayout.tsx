import { ReactNode } from 'react'
import { BaseLayout } from '../BaseLayout'
import { AgentsSidebar } from '../AgentsSidebar'

interface AgentsLayoutProps {
  /** 自定义样式类名 */
  className?: string
  /** 创建Agent回调 */
  onCreateAgent?: () => void
  /** 主要内容 */
  children: ReactNode
}

/**
 * Agent管理页面专用布局 - 带Agent列表侧边栏
 */
export function AgentsLayout({
  className,
  onCreateAgent,
  children
}: AgentsLayoutProps) {
  const sidebar = (
    <AgentsSidebar
      onCreateAgent={onCreateAgent}
    />
  )

  return (
    <BaseLayout
      className={className}
      showNavigation={true}
      sidebar={sidebar}
    >
      {children}
    </BaseLayout>
  )
}