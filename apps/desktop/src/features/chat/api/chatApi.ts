// 聊天 API 接口
import { invokeApi } from '@/shared/api/client';

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: number;
  updated_at: number;
}

/**
 * 会话
 */
export interface Conversation {
  id: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: number;
  updated_at: number;
  last_message_at?: number;
}

/**
 * 发送消息请求
 */
export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  role?: 'user';
  metadata?: Record<string, any>;
}

/**
 * 创建会话请求
 */
export interface CreateConversationRequest {
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * 更新会话请求
 */
export interface UpdateConversationRequest {
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * 消息列表查询参数
 */
export interface GetMessagesParams {
  conversation_id: string;
  limit?: number;
  offset?: number;
  before?: string; // 消息 ID
  after?: string; // 消息 ID
}

/**
 * 会话列表查询参数
 */
export interface GetConversationsParams {
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * 聊天 API 接口
 */
export const chatApi = {
  /**
   * 发送消息
   */
  sendMessage: (request: SendMessageRequest): Promise<ChatMessage> =>
    invokeApi('chat_send_message', { request }),

  /**
   * 获取消息列表
   */
  getMessages: (params: GetMessagesParams): Promise<ChatMessage[]> =>
    invokeApi('chat_get_messages', { params }),

  /**
   * 获取单个消息
   */
  getMessage: (messageId: string): Promise<ChatMessage> =>
    invokeApi('chat_get_message', { message_id: messageId }),

  /**
   * 删除消息
   */
  deleteMessage: (messageId: string): Promise<void> =>
    invokeApi('chat_delete_message', { message_id: messageId }),

  /**
   * 创建会话
   */
  createConversation: (request: CreateConversationRequest): Promise<Conversation> =>
    invokeApi('chat_create_conversation', { request }),

  /**
   * 获取会话列表
   */
  getConversations: (params?: GetConversationsParams): Promise<Conversation[]> =>
    invokeApi('chat_get_conversations', { params: params || {} }),

  /**
   * 获取单个会话
   */
  getConversation: (conversationId: string): Promise<Conversation> =>
    invokeApi('chat_get_conversation', { conversation_id: conversationId }),

  /**
   * 更新会话
   */
  updateConversation: (
    conversationId: string,
    updates: UpdateConversationRequest
  ): Promise<Conversation> =>
    invokeApi('chat_update_conversation', { 
      conversation_id: conversationId, 
      updates 
    }),

  /**
   * 删除会话
   */
  deleteConversation: (conversationId: string): Promise<void> =>
    invokeApi('chat_delete_conversation', { conversation_id: conversationId }),

  /**
   * 搜索消息
   */
  searchMessages: (query: string, conversationId?: string): Promise<ChatMessage[]> =>
    invokeApi('chat_search_messages', { 
      query, 
      conversation_id: conversationId 
    }),

  /**
   * 流式发送消息（WebSocket 或 Server-Sent Events）
   */
  sendMessageStream: (
    request: SendMessageRequest,
    _onMessage: (chunk: string) => void,
    _onComplete: (message: ChatMessage) => void,
    _onError: (error: Error) => void
  ): Promise<() => void> => {
    // 这里需要根据后端实现调整
    return invokeApi('chat_send_message_stream', { 
      request,
      // 传递回调函数的引用或ID
    });
  },
} as const;