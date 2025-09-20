import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, Conversation } from '@/features/chat/api/chatApi';

// 消息状态枚举
export type MessageStatus = 'sending' | 'sent' | 'failed' | 'delivered';

// 扩展的聊天消息，包含UI状态
export interface ChatMessageWithStatus extends ChatMessage {
  status?: MessageStatus;
  isStreaming?: boolean;
  streamContent?: string;
  error?: string;
}

// 聊天界面状态
export interface ChatState {
  // 当前活动会话
  activeConversationId: string | null;
  
  // 消息相关状态
  messages: Record<string, ChatMessageWithStatus[]>; // conversationId -> messages
  pendingMessages: Record<string, ChatMessageWithStatus[]>; // conversationId -> pending messages
  
  // 会话相关状态
  conversations: Conversation[];
  conversationDrafts: Record<string, string>; // conversationId -> draft content
  
  // UI状态
  isTyping: boolean;
  typingConversationId: string | null;
  sidebarCollapsed: boolean;
  
  // 搜索状态
  searchQuery: string;
  searchResults: ChatMessage[];
  isSearching: boolean;
  
  // 设置状态
  settings: {
    showTimestamps: boolean;
    enableNotifications: boolean;
    autoScroll: boolean;
    fontSize: 'small' | 'medium' | 'large';
    theme: 'light' | 'dark' | 'auto';
  };
}

// Store Actions
interface ChatActions {
  // 会话管理
  setActiveConversation: (conversationId: string | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  removeConversation: (conversationId: string) => void;
  setConversations: (conversations: Conversation[]) => void;
  
  // 消息管理
  addMessage: (conversationId: string, message: ChatMessageWithStatus) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessageWithStatus>) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  setMessages: (conversationId: string, messages: ChatMessageWithStatus[]) => void;
  clearMessages: (conversationId: string) => void;
  
  // 待发送消息管理
  addPendingMessage: (conversationId: string, message: ChatMessageWithStatus) => void;
  updatePendingMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessageWithStatus>) => void;
  removePendingMessage: (conversationId: string, messageId: string) => void;
  clearPendingMessages: (conversationId: string) => void;
  
  // 草稿管理
  setDraft: (conversationId: string, content: string) => void;
  clearDraft: (conversationId: string) => void;
  
  // UI状态管理
  setTyping: (isTyping: boolean, conversationId?: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // 搜索管理
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: ChatMessage[]) => void;
  setSearching: (isSearching: boolean) => void;
  clearSearch: () => void;
  
  // 设置管理
  updateSettings: (settings: Partial<ChatState['settings']>) => void;
  
  // 流式消息处理
  startStreamingMessage: (conversationId: string, messageId: string) => void;
  updateStreamingMessage: (conversationId: string, messageId: string, content: string) => void;
  finishStreamingMessage: (conversationId: string, messageId: string, finalMessage: ChatMessage) => void;
  
  // 辅助方法
  getActiveConversation: () => Conversation | null;
  getConversationMessages: (conversationId: string) => ChatMessageWithStatus[];
  getConversationDraft: (conversationId: string) => string;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      activeConversationId: null,
      messages: {},
      pendingMessages: {},
      conversations: [],
      conversationDrafts: {},
      isTyping: false,
      typingConversationId: null,
      sidebarCollapsed: false,
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      settings: {
        showTimestamps: true,
        enableNotifications: true,
        autoScroll: true,
        fontSize: 'medium',
        theme: 'auto',
      },

      // 会话管理
      setActiveConversation: (conversationId) => {
        set({ activeConversationId: conversationId });
      },

      addConversation: (conversation) => {
        set((state) => ({
          conversations: [conversation, ...state.conversations],
        }));
      },

      updateConversation: (conversationId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, ...updates } : conv
          ),
        }));
      },

      removeConversation: (conversationId) => {
        set((state) => {
          const newMessages = { ...state.messages };
          const newPendingMessages = { ...state.pendingMessages };
          const newDrafts = { ...state.conversationDrafts };
          
          delete newMessages[conversationId];
          delete newPendingMessages[conversationId];
          delete newDrafts[conversationId];
          
          return {
            conversations: state.conversations.filter((conv) => conv.id !== conversationId),
            messages: newMessages,
            pendingMessages: newPendingMessages,
            conversationDrafts: newDrafts,
            activeConversationId: 
              state.activeConversationId === conversationId ? null : state.activeConversationId,
          };
        });
      },

      setConversations: (conversations) => {
        set({ conversations });
      },

      // 消息管理
      addMessage: (conversationId, message) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [...(state.messages[conversationId] || []), message],
          },
        }));
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
          },
        }));
      },

      removeMessage: (conversationId, messageId) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).filter(
              (msg) => msg.id !== messageId
            ),
          },
        }));
      },

      setMessages: (conversationId, messages) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: messages,
          },
        }));
      },

      clearMessages: (conversationId) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [],
          },
        }));
      },

      // 待发送消息管理
      addPendingMessage: (conversationId, message) => {
        set((state) => ({
          pendingMessages: {
            ...state.pendingMessages,
            [conversationId]: [...(state.pendingMessages[conversationId] || []), message],
          },
        }));
      },

      updatePendingMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          pendingMessages: {
            ...state.pendingMessages,
            [conversationId]: (state.pendingMessages[conversationId] || []).map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
          },
        }));
      },

      removePendingMessage: (conversationId, messageId) => {
        set((state) => ({
          pendingMessages: {
            ...state.pendingMessages,
            [conversationId]: (state.pendingMessages[conversationId] || []).filter(
              (msg) => msg.id !== messageId
            ),
          },
        }));
      },

      clearPendingMessages: (conversationId) => {
        set((state) => ({
          pendingMessages: {
            ...state.pendingMessages,
            [conversationId]: [],
          },
        }));
      },

      // 草稿管理
      setDraft: (conversationId, content) => {
        set((state) => ({
          conversationDrafts: {
            ...state.conversationDrafts,
            [conversationId]: content,
          },
        }));
      },

      clearDraft: (conversationId) => {
        set((state) => {
          const newDrafts = { ...state.conversationDrafts };
          delete newDrafts[conversationId];
          return { conversationDrafts: newDrafts };
        });
      },

      // UI状态管理
      setTyping: (isTyping, conversationId) => {
        set({ isTyping, typingConversationId: conversationId || null });
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      // 搜索管理
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSearchResults: (results) => {
        set({ searchResults: results });
      },

      setSearching: (isSearching) => {
        set({ isSearching });
      },

      clearSearch: () => {
        set({ searchQuery: '', searchResults: [], isSearching: false });
      },

      // 设置管理
      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      // 流式消息处理
      startStreamingMessage: (conversationId, messageId) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).map((msg) =>
              msg.id === messageId 
                ? { ...msg, isStreaming: true, streamContent: '' } 
                : msg
            ),
          },
        }));
      },

      updateStreamingMessage: (conversationId, messageId, content) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).map((msg) =>
              msg.id === messageId 
                ? { ...msg, streamContent: (msg.streamContent || '') + content } 
                : msg
            ),
          },
        }));
      },

      finishStreamingMessage: (conversationId, messageId, finalMessage) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).map((msg) =>
              msg.id === messageId 
                ? { 
                    ...finalMessage, 
                    isStreaming: false, 
                    streamContent: undefined,
                    status: 'sent' 
                  } 
                : msg
            ),
          },
        }));
      },

      // 辅助方法
      getActiveConversation: () => {
        const state = get();
        return state.conversations.find((conv) => conv.id === state.activeConversationId) || null;
      },

      getConversationMessages: (conversationId) => {
        const state = get();
        return state.messages[conversationId] || [];
      },

      getConversationDraft: (conversationId) => {
        const state = get();
        return state.conversationDrafts[conversationId] || '';
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        activeConversationId: state.activeConversationId,
        conversations: state.conversations,
        conversationDrafts: state.conversationDrafts,
        sidebarCollapsed: state.sidebarCollapsed,
        settings: state.settings,
        // 注意：消息不持久化到localStorage，因为数据量可能很大
        // 消息应该从API重新获取
      }),
    }
  )
);