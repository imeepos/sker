import { Message, ToolCall, ToolCallStatus } from '../types/chat'
import type { McpToolCallBeginEvent } from '../types/protocol'
import { safeJsonStringify } from './text-formatting'

/**
 * 消息处理器 - 专门处理工具调用相关的消息逻辑
 * 参考TUI的事件处理模式，提供智能的消息状态管理
 */

export interface ToolCallEvent {
  type: 'begin' | 'end' | 'update'
  callId: string
  toolName: string
  arguments?: Record<string, any>
  result?: any
  success?: boolean
  error?: string
  duration?: number
}

export class MessageProcessor {
  /**
   * 处理工具调用开始事件
   */
  static handleToolCallBegin(
    messages: Message[],
    conversationId: string,
    event: McpToolCallBeginEvent
  ): { action: 'add' | 'update', message: Message } {
    // 查找最近的AI消息
    const latestAiMessage = [...messages]
      .reverse()
      .find(m => m.role === 'assistant')

    const toolCall: ToolCall = {
      id: event.call_id,
      name: event.invocation.tool,
      arguments: (event.invocation.arguments && typeof event.invocation.arguments === 'object') 
        ? event.invocation.arguments as Record<string, any>
        : {},
      status: 'running',
      startTime: Date.now(),
      invocation: event.invocation
    }

    if (latestAiMessage && !latestAiMessage.isStreaming) {
      // 更新现有消息
      return {
        action: 'update',
        message: {
          ...latestAiMessage,
          toolCalls: [...(latestAiMessage.toolCalls || []), toolCall]
        }
      }
    } else {
      // 创建新消息
      return {
        action: 'add',
        message: {
          id: `agent-${Date.now()}`,
          conversationId,
          role: 'assistant',
          content: '',
          toolCalls: [toolCall],
          timestamp: Date.now()
        }
      }
    }
  }

  /**
   * 处理工具调用结束事件
   */
  static handleToolCallEnd(
    messages: Message[],
    event: {
      call_id: string
      success: boolean
      result?: any
      duration?: string
    }
  ): { messageId: string, updatedToolCalls: ToolCall[] } | null {
    // 查找包含该工具调用的消息
    const messageWithToolCall = [...messages]
      .reverse()
      .find(m => 
        m.role === 'assistant' && 
        m.toolCalls?.some(tc => tc.id === event.call_id)
      )

    if (!messageWithToolCall) {
      console.warn('未找到对应的工具调用消息:', event.call_id)
      return null
    }

    const updatedToolCalls = messageWithToolCall.toolCalls!.map(tc => 
      tc.id === event.call_id 
        ? {
            ...tc,
            status: event.success ? 'success' as ToolCallStatus : 'error' as ToolCallStatus,
            result: event.result,
            error: event.success ? undefined : '工具执行失败',
            endTime: Date.now()
          }
        : tc
    )

    return {
      messageId: messageWithToolCall.id,
      updatedToolCalls
    }
  }

  /**
   * 检查消息是否需要工具调用状态更新
   */
  static shouldShowToolCallUI(message: Message): boolean {
    return !!(message.toolCalls && message.toolCalls.length > 0)
  }

  /**
   * 获取消息中工具调用的总体状态
   */
  static getOverallToolCallStatus(toolCalls: ToolCall[]): ToolCallStatus {
    if (toolCalls.some(tc => tc.status === 'running')) {
      return 'running'
    }
    if (toolCalls.some(tc => tc.status === 'error')) {
      return 'error'
    }
    if (toolCalls.every(tc => tc.status === 'success')) {
      return 'success'
    }
    return 'pending'
  }

  /**
   * 计算工具调用的总执行时间
   */
  static calculateTotalDuration(toolCalls: ToolCall[]): number {
    return toolCalls.reduce((total, tc) => {
      if (tc.endTime) {
        return total + (tc.endTime - tc.startTime)
      }
      return total
    }, 0)
  }

  /**
   * 获取工具调用的简要描述
   */
  static getToolCallSummary(toolCalls: ToolCall[]): string {
    if (toolCalls.length === 0) return ''
    
    if (toolCalls.length === 1) {
      return `${toolCalls[0].name}`
    }
    
    // 按工具类型分组
    const toolGroups = toolCalls.reduce((groups, tc) => {
      groups[tc.name] = (groups[tc.name] || 0) + 1
      return groups
    }, {} as Record<string, number>)
    
    const summary = Object.entries(toolGroups)
      .map(([name, count]) => count > 1 ? `${name}(${count})` : name)
      .join(', ')
    
    return summary.length > 50 ? `${summary.substring(0, 47)}...` : summary
  }

  /**
   * 检查是否应该自动折叠工具调用
   */
  static shouldAutoCollapse(toolCalls: ToolCall[]): boolean {
    // 如果有超过3个工具调用，或者所有都已完成，则自动折叠
    return toolCalls.length > 3 || toolCalls.every(tc => 
      tc.status === 'success' || tc.status === 'error'
    )
  }

  /**
   * 过滤和整理工具调用历史
   */
  static optimizeToolCallHistory(toolCalls: ToolCall[]): ToolCall[] {
    // 按开始时间排序
    const sortedCalls = [...toolCalls].sort((a, b) => a.startTime - b.startTime)
    
    // 可以在这里添加更多优化逻辑，比如合并相似的调用等
    return sortedCalls
  }

  /**
   * 生成工具调用的唯一标识符
   */
  static generateToolCallId(): string {
    return `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证工具调用参数
   */
  static validateToolCallArguments(args: any): boolean {
    try {
      // 基本验证 - 确保可以序列化
      safeJsonStringify(args)
      return true
    } catch {
      return false
    }
  }

  /**
   * 格式化工具调用错误信息
   */
  static formatToolCallError(error: any): string {
    if (typeof error === 'string') {
      return error
    }
    if (error?.message) {
      return error.message
    }
    return '工具调用执行失败'
  }
}