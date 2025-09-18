import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { invoke } from '@tauri-apps/api/core'
import { Message, Conversation, ModelConfig, MessageAttachment, ConversationEvent } from '../types/chat'
import { 
  EventMsg, 
  UserMessageEvent, 
  AgentMessageEvent, 
  AgentMessageDeltaEvent, 
  ErrorEvent 
} from '../types/protocol'
import { 
  EventClassifier, 
  EventAggregator, 
  EventLayer, 
  DEFAULT_EVENT_MERGE_CONFIG,
  EventMergeConfig
} from '../types/events'
import { streamController } from '../lib/streamController'

// 临时Event类型定义，直到生成正确的类型
interface ProtocolEvent {
  id: string
  msg: EventMsg
}
import { MessageProcessor } from '../lib/message-processor'
import { eventListenerManager } from '../services/EventListenerManager'

// 初始化流控制器回调
streamController.setOnContentUpdate((conversationId: string, messageId: string, content: string) => {
  // 通过store更新消息内容
  const store = useChatStore.getState()
  store.updateStreamingMessage(conversationId, messageId, content)
})

// 消息创建辅助函数
const createUserMessage = (conversationId: string, event: UserMessageEvent): Message => ({
  id: `user-${Date.now()}`,
  conversationId,
  role: 'user',
  content: event.message,
  timestamp: Date.now()
})

const createAgentMessage = (conversationId: string, event: AgentMessageEvent): Message => ({
  id: `agent-${Date.now()}`,
  conversationId,
  role: 'assistant',
  content: event.message,
  timestamp: Date.now(),
  isStreaming: false
})

const createStreamingAgentMessage = (conversationId: string, event: AgentMessageDeltaEvent): Message => ({
  id: `agent-${Date.now()}`,
  conversationId,
  role: 'assistant',
  content: event.delta,
  timestamp: Date.now(),
  isStreaming: true
})

const createErrorMessage = (conversationId: string, event: ErrorEvent): Message => ({
  id: `error-${Date.now()}`,
  conversationId,
  role: 'system',
  content: `错误: ${event.message}`,
  timestamp: Date.now()
})

interface ChatState {
  // 状态
  conversations: Conversation[]
  activeConversationId: string | null
  isLoading: boolean
  models: ModelConfig[]
  currentModel: string
  
  activeConversation: Conversation | null
  // 事件存储 - 按对话ID组织
  conversationEvents: Record<string, ConversationEvent[]>
  // 事件聚合器实例
  eventAggregator: EventAggregator
  // 事件合并配置
  eventMergeConfig: EventMergeConfig
  
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
  
  // 事件管理
  addConversationEvent: (conversationId: string, event: EventMsg) => void
  addConversationEventWithId: (conversationId: string, eventId: string, event: EventMsg) => void
  updateConversationEvent: (conversationId: string, eventId: string, updates: Partial<ConversationEvent>) => void
  getConversationEvents: (conversationId: string) => ConversationEvent[]
  getAggregatedEvents: (conversationId: string) => EventLayer[]
  
  // 新的流式事件处理 - 基于流控制器
  handleStreamEvent: (conversationId: string, eventId: string, event: EventMsg) => void
  updateStreamingMessage: (conversationId: string, messageId: string, content: string) => void
  
  // 简化的事件处理 - 使用标准协议事件类型
  handleConversationEvent: (conversationId: string, event: EventMsg) => void
  handleConversationEventWithId: (conversationId: string, eventId: string, event: EventMsg) => void
  processEventMessage: (conversationId: string, event: EventMsg) => void
  subscribeToConversation: (conversationId: string) => Promise<() => void>
  unsubscribeFromConversation: (conversationId: string) => void
}


export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    conversations: [],
    activeConversationId: null,
    activeConversation: null,
    isLoading: false,
    conversationEvents: {},
    eventAggregator: new EventAggregator(DEFAULT_EVENT_MERGE_CONFIG),
    eventMergeConfig: DEFAULT_EVENT_MERGE_CONFIG,
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
      
      // 🔥 新功能：立即添加"正在回复..."的临时助手消息，等待流式输出替换
      const tempAssistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        conversationId: activeConversationId,
        role: 'assistant',
        content: '智能助手正在回复...',
        timestamp: Date.now(),
        isStreaming: false
      }
      get().addMessage(tempAssistantMessage)
      
      try {
        await invoke('send_message', {
          request: {
            conversation_id: activeConversationId,
            content,
          }
        })
      } catch (error) {
        console.error('发送消息失败:', error)
        
        // 移除临时的"正在回复..."消息
        set(state => ({
          conversations: state.conversations.map(conv => 
            conv.id === activeConversationId
              ? {
                  ...conv,
                  messages: conv.messages.filter(msg => msg.id !== tempAssistantMessage.id)
                }
              : conv
          )
        }))
        
        // 使用统一的错误消息创建函数
        const errorEvent: ErrorEvent = { message: String(error) }
        const errorMessage = createErrorMessage(activeConversationId, errorEvent)
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
      
      set(state => {
        // 删除对话和对应的事件
        const { [id]: deletedEvents, ...restEvents } = state.conversationEvents
        return {
          conversations: state.conversations.filter(c => c.id !== id),
          conversationEvents: restEvents
        }
      })
      
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
    
    // 事件管理函数
    addConversationEvent: (conversationId, event) => {
      const conversationEvent: ConversationEvent = {
        id: `event-${Date.now()}-${Math.random()}`,
        conversationId,
        event,
        timestamp: Date.now(),
        status: event.type === 'error' ? 'error' : 
                event.type === 'task_complete' ? 'completed' : 
                event.type.includes('begin') ? 'processing' : 'completed'
      }
      
      set(state => ({
        conversationEvents: {
          ...state.conversationEvents,
          [conversationId]: [...(state.conversationEvents[conversationId] || []), conversationEvent]
        }
      }))
    },

    // 带特定事件ID的事件管理函数
    addConversationEventWithId: (conversationId: string, eventId: string, event: EventMsg) => {
      const conversationEvent: ConversationEvent = {
        id: eventId, // 使用后端提供的真实事件ID
        conversationId,
        event,
        timestamp: Date.now(),
        status: event.type === 'error' ? 'error' : 
                event.type === 'task_complete' ? 'completed' : 
                event.type.includes('begin') ? 'processing' : 'completed'
      }
      
      set(state => ({
        conversationEvents: {
          ...state.conversationEvents,
          [conversationId]: [...(state.conversationEvents[conversationId] || []), conversationEvent]
        }
      }))
    },
    
    updateConversationEvent: (conversationId, eventId, updates) => {
      set(state => ({
        conversationEvents: {
          ...state.conversationEvents,
          [conversationId]: (state.conversationEvents[conversationId] || []).map(evt => 
            evt.id === eventId ? { ...evt, ...updates } : evt
          )
        }
      }))
    },
    
    getConversationEvents: (conversationId) => {
      return get().conversationEvents[conversationId] || []
    },
    
    getAggregatedEvents: (conversationId) => {
      const { conversationEvents, eventAggregator } = get()
      const events = conversationEvents[conversationId] || []
      return eventAggregator.aggregateEvents(events)
    },
    
    // 新的流式事件处理 - 基于流控制器
    handleStreamEvent: (conversationId, eventId, event) => {
      const { updateConversationEvent, conversationEvents } = get()
      
      // 🔥 新功能：当有新事件到来时，自动完成前一个处理中的事件
      const existingEvents = conversationEvents[conversationId] || []
      const processingEvents = existingEvents.filter(evt => evt.status === 'processing')
      
      // 如果当前不是增量事件，则完成之前所有处理中的事件
      const isDeltaEvent = event.type === 'agent_message_delta' || event.type === 'agent_reasoning_delta'
      if (!isDeltaEvent && processingEvents.length > 0) {
        console.log('[EventCompletion] 检测到新事件，自动完成前一个处理中的事件:', processingEvents.length)
        processingEvents.forEach(evt => {
          console.log('[EventCompletion] 完成事件:', evt.id, evt.event.type)
          updateConversationEvent(conversationId, evt.id, {
            status: 'completed'
          })
        })
      }
      
      // 对于审批事件和生命周期事件，必须保留原始ID
      const isApprovalEvent = event.type === 'exec_approval_request' || event.type === 'apply_patch_approval_request'
      const isLifecycleEvent = EventClassifier.isLifecycleBegin(event.type) || EventClassifier.isLifecycleEnd(event.type)
      
      // 只为普通事件且ID为"0"的情况生成新ID
      const safeEventId = (isApprovalEvent || isLifecycleEvent) ? eventId : 
        (eventId && eventId !== "0" 
          ? eventId 
          : `${event.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
      
      console.log('[StreamController] 处理事件:', safeEventId, event.type, 
        isApprovalEvent ? '(审批事件)' : isLifecycleEvent ? '(生命周期事件)' : '')
      
      // 统一的事件处理流程
      switch (event.type) {
        case 'agent_message': {
          const agentEvent = event as any
          streamController.applyFinalMessage(conversationId, safeEventId, agentEvent.message)
          break
        }
        
        case 'agent_message_delta': {
          const deltaEvent = event as any
          streamController.pushDelta(conversationId, safeEventId, deltaEvent.delta)
          
          // 🔥 新功能：如果检测到流式内容，移除"正在回复..."的静态消息
          const { conversations } = get()
          const conversation = conversations.find(c => c.id === conversationId)
          if (conversation) {
            // 查找最后一个助手消息，如果是"正在回复..."或类似的状态消息，则替换为流式内容
            const lastAssistantMessage = [...conversation.messages]
              .reverse()
              .find(m => m.role === 'assistant')
            
            if (lastAssistantMessage && 
                (lastAssistantMessage.content.includes('正在回复') || 
                 lastAssistantMessage.content.includes('智能助手') ||
                 lastAssistantMessage.content.trim() === '' ||
                 lastAssistantMessage.content.length < 10)) {
              console.log('[StreamReplacement] 替换静态回复状态为流式内容:', lastAssistantMessage.id)
              
              // 删除旧的临时消息，添加新的流式消息
              const newStreamingMessage: Message = {
                id: safeEventId,
                conversationId,
                role: 'assistant',
                content: deltaEvent.delta,
                timestamp: Date.now(),
                isStreaming: true
              }
              
              // 用新消息替换旧消息
              set(state => ({
                conversations: state.conversations.map(conv => 
                  conv.id === conversationId
                    ? {
                        ...conv,
                        messages: conv.messages.map(msg => 
                          msg.id === lastAssistantMessage.id ? newStreamingMessage : msg
                        )
                      }
                    : conv
                )
              }))
            }
          }
          break
        }
        
        case 'task_complete': {
          // 完成所有流
          streamController.finalizeAllStreams(conversationId)
          
          // 🔥 优化：确保所有处理中的事件都被标记为完成
          const { updateConversationEvent } = get()
          const events = conversationEvents[conversationId] || []
          const stillProcessingEvents = events.filter(evt => evt.status === 'processing')
          
          console.log('[TaskComplete] 完成剩余处理中的事件:', stillProcessingEvents.length)
          stillProcessingEvents.forEach(evt => {
            console.log('[TaskComplete] 完成事件:', evt.id, evt.event.type)
            updateConversationEvent(conversationId, evt.id, {
              status: 'completed'
            })
          })
          break
        }
        
        case 'task_started': {
          // 开始新的任务流
          streamController.beginStream(conversationId, safeEventId)
          break
        }
        
        default:
          // 其他事件直接处理，不使用流控制器
          break
      }
      
      // 处理生命周期事件的状态更新
      if (isLifecycleEvent) {
        const events = conversationEvents[conversationId] || []
        
        if (EventClassifier.isLifecycleEnd(event.type)) {
          const callId = (event as any).call_id
          if (callId) {
            // 查找对应的开始事件并更新状态
            const beginEvent = events
              .slice()
              .reverse()
              .find(e => {
                const eCallId = (e.event as any).call_id
                const partnerType = EventClassifier.getLifecyclePartner(event.type)
                return eCallId === callId && e.event.type === partnerType
              })
            
            if (beginEvent) {
              console.log('[StreamController] 更新生命周期开始事件状态:', beginEvent.id, '完成状态:', 
                (event as any).status === 'error' ? 'error' : 'completed')
              updateConversationEvent(conversationId, beginEvent.id, {
                status: (event as any).status === 'error' ? 'error' : 'completed'
              })
            }
          }
        }
      }
      
      // 🔥 优化：根据事件类型设置合适的初始状态
      let initialStatus: 'pending' | 'processing' | 'completed' | 'error' = 'completed'
      
      // 处理中状态的事件类型
      if (event.type.includes('begin') || 
          event.type === 'agent_message_delta' || 
          event.type === 'agent_reasoning_delta' ||
          event.type === 'task_started') {
        initialStatus = 'processing'
      }
      // 错误状态
      else if (event.type === 'error' || event.type === 'stream_error') {
        initialStatus = 'error'
      }
      // 审批请求状态
      else if (event.type === 'exec_approval_request' || event.type === 'apply_patch_approval_request') {
        initialStatus = 'pending'
      }
      
      // 添加事件到存储（带状态）
      const conversationEvent: ConversationEvent = {
        id: safeEventId,
        conversationId,
        event,
        timestamp: Date.now(),
        status: initialStatus
      }
      
      set(state => ({
        conversationEvents: {
          ...state.conversationEvents,
          [conversationId]: [...(state.conversationEvents[conversationId] || []), conversationEvent]
        }
      }))
      
      console.log('[EventStatus] 添加事件:', safeEventId, event.type, '状态:', initialStatus)
      
      // 处理其他消息逻辑（非流式部分）
      get().processEventMessage(conversationId, event)
    },
    
    // 更新流式消息内容
    updateStreamingMessage: (conversationId, messageId, content) => {
      const { conversations, updateMessage } = get()
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) return
      
      // 查找或创建对应的消息
      let targetMessage = conversation.messages.find(m => m.id === messageId)
      
      if (!targetMessage) {
        // 创建新的流式消息
        const newMessage: Message = {
          id: messageId,
          conversationId,
          role: 'assistant',
          content,
          timestamp: Date.now(),
          isStreaming: true
        }
        get().addMessage(newMessage)
      } else {
        // 更新现有消息
        updateMessage(messageId, { 
          content, 
          isStreaming: true 
        })
      }
    },
    
    // 带特定事件ID的事件处理函数
    handleConversationEventWithId: (conversationId, eventId, event) => {
      const { addConversationEventWithId, conversations } = get()
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) return

      console.log('处理对话事件（带ID）:', eventId, event.type, event)
      
      // 使用真实的事件ID添加到事件存储中
      addConversationEventWithId(conversationId, eventId, event)

      // 复用现有的事件处理逻辑
      get().processEventMessage(conversationId, event)
    },

    // 简化的事件处理 - 使用类型安全的事件处理
    handleConversationEvent: (conversationId, event) => {
      const { conversations, addConversationEvent } = get()
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) return

      console.log('处理对话事件:', event.type, event)
      
      // 首先将所有事件添加到事件存储中
      addConversationEvent(conversationId, event)

      // 处理事件消息
      get().processEventMessage(conversationId, event)
    },

    // 抽取的公共事件消息处理逻辑
    processEventMessage: (conversationId, event) => {
      const { conversations, addMessage, updateMessage } = get()
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) return

      switch (event.type) {
        case 'user_message': {
          const userEvent = event as EventMsg & { type: 'user_message' }
          // 检查是否已经有相同内容的用户消息，避免重复
          const existingUserMessage = conversation.messages
            .reverse()
            .find(m => m.role === 'user' && m.content === userEvent.message)
          
          if (!existingUserMessage) {
            const message = createUserMessage(conversationId, userEvent)
            addMessage(message)
          }
          break
        }

        case 'agent_message': {
          const agentEvent = event as EventMsg & { type: 'agent_message' }
          // 对于完整消息，只有在没有流式传输消息时才添加
          const existingStreamingMessage = [...conversation.messages]
            .reverse()
            .find(m => m.role === 'assistant' && m.isStreaming)
          
          if (!existingStreamingMessage) {
            const message = createAgentMessage(conversationId, agentEvent)
            addMessage(message)
          }
          break
        }

        case 'agent_message_delta': {
          const deltaEvent = event as EventMsg & { type: 'agent_message_delta' }
          let lastAiMessage = [...conversation.messages]
            .reverse()
            .find(m => m.role === 'assistant' && m.isStreaming)
          
          if (!lastAiMessage) {
            const message = createStreamingAgentMessage(conversationId, deltaEvent)
            addMessage(message)
          } else {
            updateMessage(lastAiMessage.id, {
              content: lastAiMessage.content + deltaEvent.delta
            })
          }
          break
        }

        case 'mcp_tool_call_begin': {
          const toolEvent = event as EventMsg & { type: 'mcp_tool_call_begin' }
          // 工具调用开始 - 使用MessageProcessor处理
          if (toolEvent.call_id && toolEvent.invocation) {
            const { action, message } = MessageProcessor.handleToolCallBegin(
              conversation.messages,
              conversationId,
              toolEvent
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
        }

        case 'mcp_tool_call_end': {
          const toolEndEvent = event as EventMsg & { type: 'mcp_tool_call_end' }
          // 工具调用结束 - 使用MessageProcessor处理
          if (toolEndEvent.call_id) {
            const success = 'result' in toolEndEvent && toolEndEvent.result && 'Ok' in toolEndEvent.result
            const result = MessageProcessor.handleToolCallEnd(
              conversation.messages,
              {
                call_id: toolEndEvent.call_id,
                success,
                result: 'result' in toolEndEvent ? toolEndEvent.result : null,
                duration: 'duration' in toolEndEvent ? toolEndEvent.duration : '0ms'
              }
            )
            
            if (result) {
              updateMessage(result.messageId, {
                toolCalls: result.updatedToolCalls
              })
            }
          }
          break
        }

        case 'web_search_begin': {
          const webSearchEvent = event as EventMsg & { type: 'web_search_begin' }
          // Web搜索开始
          if (webSearchEvent.call_id) {
            let currentAiMessage = [...conversation.messages]
              .reverse()
              .find(m => m.role === 'assistant')
            
            const toolCall = {
              id: webSearchEvent.call_id,
              name: 'web_search',
              arguments: { query: 'web搜索' },
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
        }

        case 'task_complete': {
          // 结束所有流式消息
          const streamingMessage = [...conversation.messages]
            .reverse()
            .find(m => m.role === 'assistant' && m.isStreaming)
          
          if (streamingMessage) {
            console.log('任务完成，结束流式消息:', streamingMessage.id)
            updateMessage(streamingMessage.id, {
              isStreaming: false
            })
          }
          
          // 同时更新相关的处理中事件状态为完成
          const processingEvents = (get().conversationEvents[conversationId] || [])
            .filter(e => e.status === 'processing')
          
          processingEvents.forEach(evt => {
            get().updateConversationEvent(conversationId, evt.id, {
              status: 'completed'
            })
          })
          
          break
        }

        case 'error': {
          const errorEvent = event as EventMsg & { type: 'error' }
          const errorMessage = createErrorMessage(conversationId, errorEvent)
          addMessage(errorMessage)
          break
        }

        case 'exec_approval_request':
        case 'apply_patch_approval_request':
        case 'session_configured':
        case 'background_event':
        case 'stream_error':
        case 'patch_apply_begin':
        case 'patch_apply_end':
        case 'turn_diff':
        case 'get_history_entry_response':
        case 'mcp_list_tools_response':
        case 'list_custom_prompts_response':
        case 'plan_update':
        case 'turn_aborted':
        case 'conversation_path':
        case 'entered_review_mode':
        case 'exited_review_mode':
        case 'agent_reasoning':
        case 'agent_reasoning_delta':
        case 'agent_reasoning_raw_content':
        case 'agent_reasoning_raw_content_delta':
        case 'agent_reasoning_section_break': {
          // 这些事件只存储在事件列表中，不需要创建消息
          console.log('处理系统事件:', event.type, event)
          break
        }

        default:
          console.log('未知事件类型:', event.type, event)
      }
    },

    // 订阅对话事件流 - 使用EventListenerManager
    subscribeToConversation: async (conversationId) => {
      console.log('开始订阅对话事件:', conversationId)
      
      const eventName = `conversation_events_${conversationId}`
      
      try {
        await eventListenerManager.addListener(eventName, (tauri_event: any) => {
          const fullEvent = tauri_event.payload
          console.log('收到对话事件:', conversationId, fullEvent)
          
          // 检查是否是完整的Event对象（包含id和msg）
          if (fullEvent && typeof fullEvent === 'object' && 'id' in fullEvent && 'msg' in fullEvent) {
            // 新格式：完整的Event对象 - 使用流式处理
            const protocolEvent = fullEvent as ProtocolEvent
            get().handleStreamEvent(conversationId, protocolEvent.id, protocolEvent.msg)
          } else {
            // 兼容旧格式：只有EventMsg
            get().handleConversationEvent(conversationId, fullEvent as EventMsg)
          }
        })
        
        console.log('对话事件订阅成功:', conversationId)
        return () => eventListenerManager.removeListener(eventName)
      } catch (error) {
        console.error('订阅对话事件失败:', error)
        throw error
      }
    },

    // 取消订阅对话事件
    unsubscribeFromConversation: (conversationId) => {
      const eventName = `conversation_events_${conversationId}`
      eventListenerManager.removeListener(eventName)
    }
  }))
)