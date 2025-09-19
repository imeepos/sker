// 协议相关类型定义
// 注：这里是基础版本，将来会被 Rust protocol-ts 生成的类型替换

// 基础类型
export interface Id {
  0: string;
}

export interface Timestamp {
  0: number;
}

// 用户类型
export interface User {
  id: Id;
  email: string;
  name: string;
  avatar?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// 认证类型
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expires_at: Timestamp;
}

// 聊天相关类型
export interface ChatMessage {
  id: Id;
  conversation_id: Id;
  role: 'user' | 'assistant';
  content: string;
  created_at: Timestamp;
}

export interface Conversation {
  id: Id;
  title: string;
  user_id: Id;
  created_at: Timestamp;
  updated_at: Timestamp;
  last_message?: ChatMessage;
}

// 智能体相关类型
export interface Agent {
  id: Id;
  name: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AgentTask {
  id: Id;
  agent_id: Id;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// 项目相关类型
export interface Project {
  id: Id;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  owner_id: Id;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// API 结果包装类型
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// 分页类型
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}
