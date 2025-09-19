// 旧版布局组件（向后兼容）
export { AppLayout } from './AppLayout'
export { MessagesPage } from './MessagesPage'
export { DefaultPage } from './DefaultPage'
export { AgentsPage } from './AgentsPage'
export { AgentsSidebar } from './AgentsSidebar'
export { ProjectsSidebar } from './ProjectsSidebar'
export type { NavigationItem, Conversation } from './AppLayout'

// 新版灵活布局系统
export { BaseLayout } from './BaseLayout'
export * from './layouts'