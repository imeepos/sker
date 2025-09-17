// ChatPro 组件库 - 使用 events 系统的专业聊天界面
export { ChatPro } from './ChatPro'
export { ChatProHeader } from './ChatProHeader'
export { ChatProInput } from './ChatProInput'
export { EventsList } from './EventsList'

// 类型定义
export interface ChatProEvent {
  id: string
  event: import('../../types/protocol/EventMsg').EventMsg
  timestamp: Date
  status?: 'pending' | 'processing' | 'completed' | 'error'
}

export interface ChatProProps {
  /** 事件列表 */
  events?: ChatProEvent[]
  /** 是否正在处理中 */
  isProcessing?: boolean
  /** 会话标题 */
  title?: string
  /** 模型名称 */
  model?: string
  /** 是否启用输入 */
  enableInput?: boolean
  /** 自定义样式类名 */
  className?: string
  /** 发送消息回调 */
  onSendMessage?: (message: string, attachments?: File[]) => void
  /** 停止处理回调 */
  onStopProcessing?: () => void
  /** 清除会话回调 */
  onClearChat?: () => void
  /** 设置回调 */
  onOpenSettings?: () => void
}