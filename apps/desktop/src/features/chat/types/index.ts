// 聊天模块类型定义统一导出

// 从API模块重新导出类型
export type {
  ChatMessage,
  Conversation,
  SendMessageRequest,
  CreateConversationRequest,
  UpdateConversationRequest,
  GetMessagesParams,
  GetConversationsParams,
} from '../api/chatApi';

// 从store重新导出类型
export type {
  MessageStatus,
  ChatMessageWithStatus,
  ChatState,
} from '@/shared/stores/chat';

// 引入基础类型
import type { ChatMessage, Conversation } from '../api/chatApi';

// UI组件相关类型
export interface MessageComponentProps {
  message: ChatMessage;
  isOwn?: boolean;
  showTimestamp?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
}

export interface ConversationComponentProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick?: (conversationId: string) => void;
  onEdit?: (conversationId: string, title: string) => void;
  onDelete?: (conversationId: string) => void;
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  maxLength?: number;
}

export interface ChatWindowProps {
  conversationId?: string;
  messages?: ChatMessage[];
  isLoading?: boolean;
  onSendMessage?: (content: string) => void;
  onLoadMore?: () => void;
}

// 聊天设置相关类型
export interface ChatSettings {
  showTimestamps: boolean;
  enableNotifications: boolean;
  autoScroll: boolean;
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'auto';
  enableSound: boolean;
  markdownSupport: boolean;
  codeHighlight: boolean;
}

// 消息渲染相关类型
export interface MessageRenderOptions {
  showAvatar?: boolean;
  showTimestamp?: boolean;
  enableMarkdown?: boolean;
  enableCodeHighlight?: boolean;
  maxWidth?: string;
}

// 搜索相关类型
export interface SearchOptions {
  query: string;
  conversationId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  messageType?: 'all' | 'user' | 'assistant';
  limit?: number;
}

export interface SearchResult {
  message: ChatMessage;
  conversation: Conversation;
  highlightedContent: string;
  score: number;
}
