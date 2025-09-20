/**
 * 智能体相关类型定义
 * 对应后端智能体管理接口
 */

// 智能体能力枚举
export enum AgentCapability {
  FrontendDevelopment = "FrontendDevelopment",
  BackendDevelopment = "BackendDevelopment", 
  DatabaseDevelopment = "DatabaseDevelopment",
  DevOps = "DevOps",
  Testing = "Testing",
  CodeReview = "CodeReview",
  Documentation = "Documentation",
  ApiDesign = "ApiDesign",
  PerformanceOptimization = "PerformanceOptimization",
  SecurityAudit = "SecurityAudit",
}

// 智能体状态枚举
export enum AgentStatus {
  Idle = "idle",
  Working = "working",
  Paused = "paused", 
  Error = "error",
  Offline = "offline",
}

// 智能体实体
export interface Agent {
  agent_id: string;
  user_id: string;
  name: string;
  description?: string;
  prompt_template: string;
  capabilities: string[];
  config: Record<string, any>;
  git_config?: Record<string, any>;
  status: string;
  current_task_id?: string;
  total_tasks_completed: number;
  success_rate: number;
  average_completion_time: number;
  created_at: string;
  updated_at: string;
  last_active_at: string;
  skill_profile?: Record<string, any>;
  skill_assessments?: Record<string, any>;
  performance_trend?: Record<string, any>;
}

// 创建智能体请求
export interface CreateAgentRequest {
  name: string;
  description?: string;
  prompt_template: string;
  capabilities: string[];
  config?: Record<string, any>;
  git_config?: Record<string, any>;
}

// 更新智能体请求
export interface UpdateAgentRequest {
  agent_id: string;
  name?: string;
  description?: string;
  prompt_template?: string;
  capabilities?: string[];
  config?: Record<string, any>;
  git_config?: Record<string, any>;
  status?: string;
}

// 智能体工作历史
export interface AgentWorkHistory {
  history_id: string;
  agent_id: string;
  task_id: string;
  task_type: string;
  started_at: string;
  completed_at?: string;
  success?: boolean;
  completion_time_minutes?: number;
  quality_score?: number;
  work_details?: Record<string, any>;
  technologies_used: string[];
  error_message?: string;
  created_at: string;
}

// 智能体性能指标
export interface AgentPerformanceMetrics {
  metrics_id: string;
  agent_id: string;
  period_start: string;
  period_end: string;
  tasks_completed: number;
  tasks_successful: number;
  avg_completion_time: number;
  avg_code_quality: number;
  skill_improvements: Record<string, any>;
  created_at: string;
}

// 智能体能力标签映射
export const AGENT_CAPABILITY_LABELS: Record<AgentCapability, string> = {
  [AgentCapability.FrontendDevelopment]: "前端开发",
  [AgentCapability.BackendDevelopment]: "后端开发",
  [AgentCapability.DatabaseDevelopment]: "数据库开发",
  [AgentCapability.DevOps]: "DevOps",
  [AgentCapability.Testing]: "测试",
  [AgentCapability.CodeReview]: "代码审查",
  [AgentCapability.Documentation]: "文档编写",
  [AgentCapability.ApiDesign]: "API设计",
  [AgentCapability.PerformanceOptimization]: "性能优化",
  [AgentCapability.SecurityAudit]: "安全审计",
};

// 智能体状态标签映射
export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  [AgentStatus.Idle]: "空闲",
  [AgentStatus.Working]: "工作中",
  [AgentStatus.Paused]: "暂停",
  [AgentStatus.Error]: "错误",
  [AgentStatus.Offline]: "离线",
};

// 智能体状态颜色映射
export const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  [AgentStatus.Idle]: "bg-gray-100 text-gray-700",
  [AgentStatus.Working]: "bg-green-100 text-green-700",
  [AgentStatus.Paused]: "bg-yellow-100 text-yellow-700",
  [AgentStatus.Error]: "bg-red-100 text-red-700",
  [AgentStatus.Offline]: "bg-gray-100 text-gray-500",
};

// 智能体统计信息
export interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  averageSuccessRate: number;
  totalTasksCompleted: number;
}

// 智能体过滤器
export interface AgentFilter {
  status?: AgentStatus[];
  capabilities?: AgentCapability[];
  search?: string;
}

// 智能体排序选项
export enum AgentSortBy {
  Name = "name",
  CreatedAt = "created_at",
  SuccessRate = "success_rate",
  TasksCompleted = "total_tasks_completed",
  LastActive = "last_active_at",
}

// 智能体列表查询参数
export interface AgentListParams {
  filter?: AgentFilter;
  sortBy?: AgentSortBy;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}