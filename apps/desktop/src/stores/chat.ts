import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { Message, Conversation, ModelConfig, MessageAttachment } from '../types/chat'
import { MessageProcessor } from '../lib/message-processor'

interface ChatState {
  // 状态
  conversations: Conversation[]
  activeConversationId: string | null
  isLoading: boolean
  models: ModelConfig[]
  currentModel: string
  
  activeConversation: Conversation | null
  
  // 动作
  _updateActiveConversation: (id: string | null) => void
  setActiveConversation: (id: string | null) => Promise<void>
  createConversation: () => Promise<string>
  sendMessage: (content: string, attachments?: MessageAttachment[]) => Promise<void>
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  deleteConversation: (id: string) => void
  setCurrentModel: (modelId: string) => void
  loadConversations: () => Promise<void>
  
  // 简化的事件处理
  handleConversationEvent: (conversationId: string, event: any) => void
  subscribeToConversation: (conversationId: string) => Promise<() => void>
  unsubscribeFromConversation: (conversationId: string) => void
}

// 对话监听器管理
const conversationUnsubscribers = new Map<string, () => void>()

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    conversations: [],
    activeConversationId: null,
    activeConversation: null,
    isLoading: false,
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        maxTokens: 8192,
        temperature: 0.7,
        description: '最先进的对话模型'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai', 
        maxTokens: 4096,
        temperature: 0.7,
        description: '快速响应的对话模型'
      }
    ],
    currentModel: 'gpt-4',
    
    // 辅助函数：更新活跃对话状态
    _updateActiveConversation: (id: string | null) => {
      const { conversations } = get()
      const activeConversation = id ? conversations.find(c => c.id === id) || null : null
      console.log('更新活跃对话状态:', { id, found: !!activeConversation })
      set({ 
        activeConversationId: id, 
        activeConversation 
      })
    },
    
    // 设置活跃对话
    setActiveConversation: async (id) => {
      const { activeConversationId, unsubscribeFromConversation, subscribeToConversation, _updateActiveConversation } = get()
      console.log('切换到对话:', id, '当前活跃对话:', activeConversationId)
      
      // 如果有之前的活跃对话，先取消订阅
      if (activeConversationId && activeConversationId !== id) {
        console.log('取消之前对话的订阅:', activeConversationId)
        unsubscribeFromConversation(activeConversationId)
      }
      
      // 更新活跃对话状态
      _updateActiveConversation(id)
      
      // 如果切换到一个有效的对话，需要重新订阅事件流
      if (id) {
        try {
          console.log('重新订阅对话事件流:', id)
          await subscribeToConversation(id)
        } catch (error) {
          console.error('订阅对话事件流失败:', error)
        }
      }
    },
    
    // 创建新对话 - 直接使用Tauri命令
    createConversation: async () => {
      console.log('开始创建新对话...')
      try {
        const conversationId = await invoke<string>('create_conversation')
        console.log('创建对话成功:', conversationId)
        
        const newConversation: Conversation = {
          id: conversationId,
          title: '新的对话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: get().currentModel,
          isActive: true
        }
        
        // 添加新对话到列表
        set(state => ({
          conversations: [newConversation, ...state.conversations]
        }))
        
        // 设置为活跃对话
        await get().setActiveConversation(conversationId)
        
        return conversationId
      } catch (error) {
        console.error('创建对话失败:', error)
        throw error
      }
    },
    
    // 发送消息 - 直接使用Tauri命令
    sendMessage: async (content: string, _attachments?: MessageAttachment[]) => {
      const { activeConversationId } = get()
      if (!activeConversationId) return
      
      // 立即添加用户消息到UI
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        conversationId: activeConversationId,
        role: 'user',
        content,
        timestamp: Date.now()
      }
      get().addMessage(userMessage)
      
      set({ isLoading: true })
      
      try {
        await invoke('send_message', {
          request: {
            conversation_id: activeConversationId,
            content,
          }
        })
      } catch (error) {
        console.error('发送消息失败:', error)
        
        // 手动添加错误消息
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          conversationId: activeConversationId,
          role: 'system',
          content: `错误: ${error}`,
          timestamp: Date.now()
        }
        get().addMessage(errorMessage)
      } finally {
        set({ isLoading: false })
      }
    },
    
    // 添加消息
    addMessage: (message) => {
      const { activeConversationId, _updateActiveConversation } = get()
      set(state => ({
        conversations: state.conversations.map(conv => 
          conv.id === message.conversationId
            ? {
                ...conv,
                messages: [...conv.messages, message],
                updatedAt: Date.now(),
                title: conv.messages.length === 0 ? message.content.slice(0, 30) : conv.title
              }
            : conv
        )
      }))
      
      // 如果添加的消息属于当前活跃对话，更新活跃对话状态
      if (message.conversationId === activeConversationId) {
        _updateActiveConversation(activeConversationId)
      }
    },
    
    // 更新消息
    updateMessage: (id, updates) => {
      const { activeConversationId, _updateActiveConversation } = get()
      let updatedConversationId: string | null = null
      
      set(state => ({
        conversations: state.conversations.map(conv => {
          const updatedMessages = conv.messages.map(msg => {
            if (msg.id === id) {
              updatedConversationId = conv.id
              return { ...msg, ...updates }
            }
            return msg
          })
          return { ...conv, messages: updatedMessages }
        })
      }))
      
      // 如果更新的消息属于当前活跃对话，更新活跃对话状态
      if (updatedConversationId === activeConversationId) {
        _updateActiveConversation(activeConversationId)
      }
    },
    
    // 删除对话
    deleteConversation: (id) => {
      const { activeConversationId, unsubscribeFromConversation, _updateActiveConversation } = get()
      
      // 如果删除的是当前活跃对话，先取消订阅
      if (activeConversationId === id) {
        console.log('删除活跃对话，取消订阅:', id)
        unsubscribeFromConversation(id)
      }
      
      set(state => ({
        conversations: state.conversations.filter(c => c.id !== id)
      }))
      
      // 更新活跃对话状态
      const newActiveId = activeConversationId === id ? null : activeConversationId
      _updateActiveConversation(newActiveId)
    },
    
    // 设置当前模型
    setCurrentModel: (modelId) => {
      set({ currentModel: modelId })
    },
    
    // 加载对话历史 - 直接使用Tauri命令
    loadConversations: async () => {
      try {
        const conversations = await invoke<Conversation[]>('load_conversations')
        set({ conversations })
      } catch (error) {
        console.error('加载对话历史失败:', error)
        set({ conversations: [] })
      }
    },
    
    // 简化的事件处理
    handleConversationEvent: (conversationId, event) => {
      const { conversations, addMessage, updateMessage } = get()
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) return

      console.log('处理对话事件:', event.type, event)

      switch (event.type) {
        case 'user_message':
          if (event.content) {
            // 检查是否已经有相同内容的用户消息，避免重复
            const existingUserMessage = conversation.messages
              .reverse()
              .find(m => m.role === 'user' && m.content === event.content)
            
            if (!existingUserMessage) {
              const message: Message = {
                id: `user-${Date.now()}`,
                conversationId,
                role: 'user',
                content: event.content,
                timestamp: Date.now()
              }
              addMessage(message)
            }
          }
          break

        case 'agent_message':
          // 对于完整消息，只有在没有流式传输消息时才添加
          if (event.content) {
            const existingStreamingMessage = [...conversation.messages]
              .reverse()
              .find(m => m.role === 'assistant' && m.isStreaming)
            
            if (!existingStreamingMessage) {
              const aiMessage: Message = {
                id: `agent-${Date.now()}`,
                conversationId,
                role: 'assistant',
                content: event.content,
                timestamp: Date.now(),
                isStreaming: false
              }
              addMessage(aiMessage)
            }
          }
          break

        case 'agent_message_delta':
          if (event.delta) {
            let lastAiMessage = [...conversation.messages]
              .reverse()
              .find(m => m.role === 'assistant' && m.isStreaming)
            
            if (!lastAiMessage) {
              const newAiMessage: Message = {
                id: `agent-${Date.now()}`,
                conversationId,
                role: 'assistant',
                content: event.delta,
                timestamp: Date.now(),
                isStreaming: true
              }
              addMessage(newAiMessage)
            } else {
              updateMessage(lastAiMessage.id, {
                content: lastAiMessage.content + event.delta
              })
            }
          }
          break

        case 'mcp_tool_call_begin':
          // 工具调用开始 - 使用MessageProcessor处理
          if (event.call_id && event.invocation) {
            const { action, message } = MessageProcessor.handleToolCallBegin(
              conversation.messages,
              conversationId,
              event
            )
            
            if (action === 'add') {
              addMessage(message)
            } else {
              updateMessage(message.id, {
                toolCalls: message.toolCalls
              })
            }
          }
          break

        case 'mcp_tool_call_end':
          // 工具调用结束 - 使用MessageProcessor处理
          if (event.call_id) {
            const result = MessageProcessor.handleToolCallEnd(
              conversation.messages,
              {
                call_id: event.call_id,
                success: event.success,
                result: event.result,
                duration: event.duration
              }
            )
            
            if (result) {
              updateMessage(result.messageId, {
                toolCalls: result.updatedToolCalls
              })
            }
          }
          break

        case 'web_search_begin':
          // Web搜索开始
          if (event.call_id) {
            let currentAiMessage = [...conversation.messages]
              .reverse()
              .find(m => m.role === 'assistant')
            
            const toolCall = {
              id: event.call_id,
              name: 'web_search',
              arguments: { query: event.query || 'web搜索' },
              status: 'running' as const,
              startTime: Date.now()
            }
            
            if (currentAiMessage) {
              const existingToolCalls = currentAiMessage.toolCalls || []
              updateMessage(currentAiMessage.id, {
                toolCalls: [...existingToolCalls, toolCall]
              })
            } else {
              const aiMessage: Message = {
                id: `agent-${Date.now()}`,
                conversationId,
                role: 'assistant',
                content: '',
                toolCalls: [toolCall],
                timestamp: Date.now()
              }
              addMessage(aiMessage)
            }
          }
          break

        case 'task_complete':
          const streamingMessage = [...conversation.messages]
            .reverse()
            .find(m => m.role === 'assistant' && m.isStreaming)
          
          if (streamingMessage) {
            updateMessage(streamingMessage.id, {
              isStreaming: false
            })
          }
          break

        case 'error':
          if (event.message) {
            const errorMessage: Message = {
              id: `error-${Date.now()}`,
              conversationId,
              role: 'system',
              content: `错误: ${event.message}`,
              timestamp: Date.now()
            }
            addMessage(errorMessage)
          }
          break

        default:
          console.log('未处理的事件:', event)
      }
    },

    // 订阅对话事件流 - 直接使用Tauri事件系统
    subscribeToConversation: async (conversationId) => {
      console.log('开始订阅对话事件:', conversationId)
      
      // 先检查是否已经有订阅，如果有则先取消
      const existingUnlisten = conversationUnsubscribers.get(conversationId)
      if (existingUnlisten) {
        console.log('发现已存在的订阅，先取消:', conversationId)
        existingUnlisten()
        conversationUnsubscribers.delete(conversationId)
      }
      
      try {
        const unlisten = await listen(`conversation_events_${conversationId}`, (event) => {
          console.log('收到对话事件:', conversationId, event.payload)
          get().handleConversationEvent(conversationId, event.payload)
        })
        
        conversationUnsubscribers.set(conversationId, unlisten)
        console.log('对话事件订阅成功:', conversationId)
        return unlisten
      } catch (error) {
        console.error('订阅对话事件失败:', error)
        throw error
      }
    },

    // 取消订阅对话事件
    unsubscribeFromConversation: (conversationId) => {
      const unlisten = conversationUnsubscribers.get(conversationId)
      if (unlisten) {
        unlisten()
        conversationUnsubscribers.delete(conversationId)
      }
    }
  }))
)