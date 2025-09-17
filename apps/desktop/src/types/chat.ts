import type { 
  ContentBlock, 
  ImageContent, 
  TextContent, 
  Role,
  McpInvocation,
  EventMsg
} from './protocol'

// 图片附件类型 - 基于标准协议的 ImageContent
export interface MessageAttachment {
  id: string
  type: 'image'
  name: string
  size: number
  mimeType: string
  data?: string // base64编码的图片数据
  url: string // 本地文件路径或URL
  width?: number // 图片宽度  
  height?: number // 图片高度
  annotations?: any // 标准协议的annotations字段
}

// 工具调用状态
export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error'

// 工具调用信息 - 基于标准协议的 McpInvocation
export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  status: ToolCallStatus
  result?: any
  error?: string
  startTime: number
  endTime?: number
  invocation?: McpInvocation // 标准协议工具调用信息
}

// 消息类型定义 - 使用标准协议的 Role 和 ContentBlock
export interface Message {
  id: string
  conversationId: string
  role: Role | 'system' // 扩展标准协议的 Role 类型
  content: string
  contentBlocks?: ContentBlock[] // 标准协议内容块
  attachments?: MessageAttachment[] // 附件列表
  toolCalls?: ToolCall[] // 工具调用列表
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