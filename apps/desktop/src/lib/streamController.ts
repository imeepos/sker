/**
 * 流式消息控制器 - 基于resources/tui的成功实践
 * 
 * 核心理念：
 * 1. 语义感知的提交策略 - 只在语义边界处提交内容
 * 2. 单一流状态管理 - 避免多个并发增量事件
 * 3. 最终一致性保证 - 通过final message确保完整性
 * 4. 性能优化 - 减少不必要的UI更新
 */

// import { EventMsg } from '../types/protocol/EventMsg' // 暂时注释，未使用

export interface StreamConfig {
  /** 最大缓冲区大小（字符数） */
  maxBufferSize: number
  /** 提交延迟（毫秒） */
  commitDelay: number
  /** 是否启用语义感知提交 */
  enableSemanticCommit: boolean
}

export const DEFAULT_STREAM_CONFIG: StreamConfig = {
  maxBufferSize: 500,
  commitDelay: 150,
  enableSemanticCommit: true
}

/**
 * 流状态管理
 */
class StreamState {
  public messageId: string
  public buffer: string = ''
  public committedContent: string = ''
  public isActive: boolean = false
  public hasSeenDelta: boolean = false
  private commitTimer: number | null = null
  
  constructor(messageId: string) {
    this.messageId = messageId
  }
  
  /**
   * 添加增量到缓冲区
   */
  appendDelta(delta: string): void {
    if (!delta) return
    
    this.buffer += delta
    this.hasSeenDelta = true
  }
  
  /**
   * 提交缓冲区内容
   */
  commitBuffer(): string {
    const content = this.buffer
    this.committedContent += content
    this.buffer = ''
    return content
  }
  
  /**
   * 获取完整内容
   */
  getFullContent(): string {
    return this.committedContent + this.buffer
  }
  
  /**
   * 应用最终消息（处理重复内容）
   */
  applyFinalMessage(finalContent: string): string {
    // 如果没有见过任何增量，直接使用最终内容
    if (!this.hasSeenDelta) {
      this.committedContent = finalContent
      this.buffer = ''
      return finalContent
    }
    
    // 如果有增量，检查最终内容是否包含已提交的内容
    const currentFull = this.getFullContent()
    if (finalContent.startsWith(currentFull)) {
      // 最终内容包含当前内容，只需要添加剩余部分
      const remaining = finalContent.substring(currentFull.length)
      this.buffer += remaining
      const result = this.commitBuffer()
      return result
    } else {
      // 内容不匹配，使用最终内容覆盖
      this.committedContent = finalContent
      this.buffer = ''
      return finalContent
    }
  }
  
  /**
   * 清理状态
   */
  clear(): void {
    this.buffer = ''
    this.committedContent = ''
    this.isActive = false
    this.hasSeenDelta = false
    if (this.commitTimer) {
      window.clearTimeout(this.commitTimer)
      this.commitTimer = null
    }
  }
  
  /**
   * 设置延迟提交
   */
  scheduleCommit(callback: () => void, delay: number): void {
    if (this.commitTimer) {
      window.clearTimeout(this.commitTimer)
    }
    this.commitTimer = window.setTimeout(callback, delay)
  }
  
  /**
   * 立即取消延迟提交
   */
  cancelScheduledCommit(): void {
    if (this.commitTimer) {
      window.clearTimeout(this.commitTimer)
      this.commitTimer = null
    }
  }
}

/**
 * 语义感知的提交策略
 */
class SemanticCommitStrategy {
  private config: StreamConfig
  
  constructor(config: StreamConfig) {
    this.config = config
  }
  
  /**
   * 判断是否应该提交内容
   */
  shouldCommit(currentBuffer: string, newDelta: string): boolean {
    if (!this.config.enableSemanticCommit) {
      return false
    }
    
    const combined = currentBuffer + newDelta
    
    // 强制大小限制
    if (combined.length > this.config.maxBufferSize) {
      return true
    }
    
    // 句子完整边界
    if (this.hasSentenceBoundary(newDelta)) {
      return true
    }
    
    // 换行符边界
    if (this.hasNewlineBoundary(newDelta)) {
      return true
    }
    
    // 代码块边界
    if (this.hasCodeBlockBoundary(combined)) {
      return true
    }
    
    // 列表项边界
    if (this.hasListItemBoundary(combined)) {
      return true
    }
    
    return false
  }
  
  private hasSentenceBoundary(text: string): boolean {
    // 检查是否以句子结尾符号结束
    return /[.!?。！？]\s*$/.test(text.trim())
  }
  
  private hasNewlineBoundary(text: string): boolean {
    // 检查是否包含换行符
    return text.includes('\n')
  }
  
  private hasCodeBlockBoundary(text: string): boolean {
    // 检查代码块开始或结束
    return /```\s*\n/.test(text) || /\n```\s*$/.test(text)
  }
  
  private hasListItemBoundary(text: string): boolean {
    // 检查列表项边界
    return /\n\s*[-*+]\s/.test(text) || /\n\s*\d+\.\s/.test(text)
  }
}

/**
 * 流式消息控制器主类
 */
export class StreamMessageController {
  private activeStreams = new Map<string, StreamState>()
  private config: StreamConfig
  private commitStrategy: SemanticCommitStrategy
  private onContentUpdate?: (conversationId: string, messageId: string, content: string) => void
  
  constructor(config: StreamConfig = DEFAULT_STREAM_CONFIG) {
    this.config = config
    this.commitStrategy = new SemanticCommitStrategy(config)
  }
  
  /**
   * 设置内容更新回调
   */
  setOnContentUpdate(callback: (conversationId: string, messageId: string, content: string) => void): void {
    this.onContentUpdate = callback
  }
  
  /**
   * 开始新的消息流
   */
  beginStream(conversationId: string, messageId: string): void {
    const streamKey = `${conversationId}:${messageId}`
    
    // 清理可能存在的旧流
    if (this.activeStreams.has(streamKey)) {
      this.finalizeStream(conversationId, messageId)
    }
    
    const stream = new StreamState(messageId)
    stream.isActive = true
    this.activeStreams.set(streamKey, stream)
    
    console.log(`[StreamController] 开始流: ${streamKey}`)
  }
  
  /**
   * 处理增量更新
   * @returns 是否触发了UI更新
   */
  pushDelta(conversationId: string, messageId: string, delta: string): boolean {
    const streamKey = `${conversationId}:${messageId}`
    let stream = this.activeStreams.get(streamKey)
    
    // 如果流不存在，自动开始新流
    if (!stream) {
      this.beginStream(conversationId, messageId)
      stream = this.activeStreams.get(streamKey)!
    }
    
    if (!stream.isActive) {
      return false
    }
    
    const oldBuffer = stream.buffer
    stream.appendDelta(delta)
    
    // 检查是否应该立即提交
    if (this.commitStrategy.shouldCommit(oldBuffer, delta)) {
      return this.commitStream(conversationId, messageId)
    }
    
    // 设置延迟提交
    stream.cancelScheduledCommit()
    stream.scheduleCommit(() => {
      this.commitStream(conversationId, messageId)
    }, this.config.commitDelay)
    
    return false
  }
  
  /**
   * 提交流内容到UI
   */
  private commitStream(conversationId: string, messageId: string): boolean {
    const streamKey = `${conversationId}:${messageId}`
    const stream = this.activeStreams.get(streamKey)
    
    if (!stream || !stream.isActive || !stream.buffer) {
      return false
    }
    
    const committedContent = stream.commitBuffer()
    if (committedContent && this.onContentUpdate) {
      const fullContent = stream.getFullContent()
      this.onContentUpdate(conversationId, messageId, fullContent)
      console.log(`[StreamController] 提交内容: ${streamKey}, 长度: ${committedContent.length}`)
      return true
    }
    
    return false
  }
  
  /**
   * 应用最终完整消息
   */
  applyFinalMessage(conversationId: string, messageId: string, content: string): void {
    const streamKey = `${conversationId}:${messageId}`
    let stream = this.activeStreams.get(streamKey)
    
    // 如果流不存在，创建新流处理最终消息
    if (!stream) {
      stream = new StreamState(messageId)
      this.activeStreams.set(streamKey, stream)
    }
    
    stream.cancelScheduledCommit()
    const finalContent = stream.applyFinalMessage(content)
    
    if (this.onContentUpdate) {
      this.onContentUpdate(conversationId, messageId, finalContent)
      console.log(`[StreamController] 应用最终消息: ${streamKey}, 长度: ${finalContent.length}`)
    }
    
    // 保持流状态以处理后续事件，但标记为非活跃
    stream.isActive = false
  }
  
  /**
   * 强制完成当前流
   */
  finalizeStream(conversationId: string, messageId: string): boolean {
    const streamKey = `${conversationId}:${messageId}`
    const stream = this.activeStreams.get(streamKey)
    
    if (!stream) {
      return false
    }
    
    stream.cancelScheduledCommit()
    
    // 如果还有缓冲内容，提交它
    let updated = false
    if (stream.buffer && stream.isActive) {
      updated = this.commitStream(conversationId, messageId)
    }
    
    stream.isActive = false
    console.log(`[StreamController] 完成流: ${streamKey}`)
    
    return updated
  }
  
  /**
   * 完成所有流（用于task_complete等事件）
   */
  finalizeAllStreams(conversationId: string): void {
    let hasUpdates = false
    
    for (const [streamKey, stream] of this.activeStreams) {
      if (streamKey.startsWith(`${conversationId}:`)) {
        const messageId = streamKey.split(':')[1]
        if (this.finalizeStream(conversationId, messageId)) {
          hasUpdates = true
        }
      }
    }
    
    if (hasUpdates) {
      console.log(`[StreamController] 完成所有流: ${conversationId}`)
    }
  }
  
  /**
   * 清理对话的所有流
   */
  clearConversationStreams(conversationId: string): void {
    const keysToDelete: string[] = []
    
    for (const streamKey of this.activeStreams.keys()) {
      if (streamKey.startsWith(`${conversationId}:`)) {
        keysToDelete.push(streamKey)
      }
    }
    
    keysToDelete.forEach(key => {
      const targetStream = this.activeStreams.get(key)
      if (targetStream) {
        targetStream.clear()
      }
      this.activeStreams.delete(key)
    })
    
    console.log(`[StreamController] 清理对话流: ${conversationId}, 清理数量: ${keysToDelete.length}`)
  }
  
  /**
   * 获取流状态信息（调试用）
   */
  getStreamInfo(conversationId: string): Array<{messageId: string, isActive: boolean, bufferSize: number, contentLength: number}> {
    const result: Array<{messageId: string, isActive: boolean, bufferSize: number, contentLength: number}> = []
    
    for (const [streamKey, stream] of this.activeStreams) {
      if (streamKey.startsWith(`${conversationId}:`)) {
        const messageId = streamKey.split(':')[1]
        result.push({
          messageId,
          isActive: stream.isActive,
          bufferSize: stream.buffer.length,
          contentLength: stream.getFullContent().length
        })
      }
    }
    
    return result
  }
}

// 全局单例实例
export const streamController = new StreamMessageController()