// 图片附件类型 - 仅支持协议层已实现的图片附件
export interface MessageAttachment {
  id: string
  type: 'image'
  name: string
  size: number
  mimeType: string
  url: string // 本地文件路径或URL
  width?: number // 图片宽度
  height?: number // 图片高度
}

// 消息类型定义
export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: MessageAttachment[] // 附件列表
  timestamp: number
  isStreaming?: boolean
  metadata?: {
    model?: string
    tokens?: number
    processingTime?: number
  }
}

// 对话状态
export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model: string
  isActive: boolean
}

// AI 模型配置
export interface ModelConfig {
  id: string
  name: string
  provider: 'openai' | 'ollama' | 'anthropic'
  maxTokens: number
  temperature: number
  description: string
}

// 流式响应事件
export interface StreamEvent {
  type: 'delta' | 'done' | 'error'
  content?: string
  error?: string
}

// 输入框状态
export interface InputState {
  value: string
  isComposing: boolean
  isSubmitting: boolean
}