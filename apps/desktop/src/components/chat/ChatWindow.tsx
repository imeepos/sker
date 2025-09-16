import { useState } from 'react'
import { Card } from '../ui/card'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { ChatStatusBar } from './ChatStatusBar'
import { useChatStore } from '../../stores/chat'
import { MessageAttachment } from '../../types/chat'
import { cn } from '../../lib/utils'

interface ChatWindowProps {
  className?: string
}

export function ChatWindow({ className }: ChatWindowProps) {
  const {
    activeConversation,
    activeConversationId,
    conversations,
    isLoading,
    sendMessage
  } = useChatStore()

  const [inputState, setInputState] = useState({
    message: '',
    attachmentCount: 0,
    canSend: false,
    loading: false
  })

  // 调试信息：新建会话后检查状态
  if (!activeConversation && activeConversationId) {
    console.warn('状态不一致：有activeConversationId但没有activeConversation', {
      activeConversationId,
      conversationsCount: conversations.length,
      conversationIds: conversations.map(c => c.id)
    })
  }

  const handleSendMessage = async (content: string, attachments?: MessageAttachment[]) => {
    // 如果没有活跃对话，提示用户先创建对话
    if (!activeConversation) {
      console.warn('请先创建或选择一个对话', {
        activeConversationId,
        conversationsCount: conversations.length
      })
      return
    }
    
    // 发送消息到当前活跃对话
    try {
      await sendMessage(content, attachments)
    } catch (error) {
      console.error('发送消息失败:', error)
    }
  }

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      {/* 消息列表区域 */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={activeConversation?.messages || []}
          className="h-full"
        />
      </div>
      
      {/* 输入区域 */}
      <div className="shrink-0">
        <ChatInput
          onSend={handleSendMessage}
          loading={isLoading}
          disabled={!activeConversation}
          placeholder={
            activeConversation 
              ? "输入你的问题..." 
              : "请先创建或选择一个对话"
          }
          onStateChange={setInputState}
        />
      </div>
      
      {/* 底部状态栏 */}
      <ChatStatusBar
        loading={isLoading}
        attachmentCount={inputState.attachmentCount}
        canSend={inputState.canSend && !!activeConversation}
        message={inputState.message}
      />
    </Card>
  )
}