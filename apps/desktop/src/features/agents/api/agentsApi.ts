// 智能体 API 接口
import { invokeApi } from '@/shared/api/client';

/**
 * 智能体
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  prompt: string;
  model: string;
  parameters: AgentParameters;
  capabilities: string[];
  tags: string[];
  is_active: boolean;
  is_public: boolean;
  created_by: string;
  created_at: number;
  updated_at: number;
}

/**
 * 智能体参数配置
 */
export interface AgentParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop_sequences?: string[];
}

/**
 * 创建智能体请求
 */
export interface CreateAgentRequest {
  name: string;
  description: string;
  avatar?: string;
  prompt: string;
  model: string;
  parameters?: AgentParameters;
  capabilities?: string[];
  tags?: string[];
  is_public?: boolean;
}

/**
 * 更新智能体请求
 */
export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  avatar?: string;
  prompt?: string;
  model?: string;
  parameters?: AgentParameters;
  capabilities?: string[];
  tags?: string[];
  is_active?: boolean;
  is_public?: boolean;
}

/**
 * 智能体列表查询参数
 */
export interface GetAgentsParams {
  limit?: number;
  offset?: number;
  search?: string;
  tags?: string[];
  is_public?: boolean;
  created_by?: string;
}

/**
 * 智能体执行请求
 */
export interface ExecuteAgentRequest {
  agent_id: string;
  input: string;
  context?: Record<string, any>;
  stream?: boolean;
}

/**
 * 智能体执行响应
 */
export interface ExecuteAgentResponse {
  output: string;
  metadata?: Record<string, any>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 智能体模板
 */
export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  model: string;
  parameters: AgentParameters;
  capabilities: string[];
  tags: string[];
}

/**
 * 智能体 API 接口
 */
export const agentsApi = {
  /**
   * 创建智能体
   */
  createAgent: (request: CreateAgentRequest): Promise<Agent> =>
    invokeApi('agents_create', { request }),

  /**
   * 获取智能体列表
   */
  getAgents: (params?: GetAgentsParams): Promise<Agent[]> =>
    invokeApi('agents_get_list', { params: params || {} }),

  /**
   * 获取单个智能体
   */
  getAgent: (agentId: string): Promise<Agent> =>
    invokeApi('agents_get', { agent_id: agentId }),

  /**
   * 更新智能体
   */
  updateAgent: (agentId: string, updates: UpdateAgentRequest): Promise<Agent> =>
    invokeApi('agents_update', { agent_id: agentId, updates }),

  /**
   * 删除智能体
   */
  deleteAgent: (agentId: string): Promise<void> =>
    invokeApi('agents_delete', { agent_id: agentId }),

  /**
   * 执行智能体
   */
  executeAgent: (request: ExecuteAgentRequest): Promise<ExecuteAgentResponse> =>
    invokeApi('agents_execute', { request }),

  /**
   * 流式执行智能体
   */
  executeAgentStream: (
    request: ExecuteAgentRequest,
    _onChunk: (chunk: string) => void,
    _onComplete: (response: ExecuteAgentResponse) => void,
    _onError: (error: Error) => void
  ): Promise<() => void> =>
    invokeApi('agents_execute_stream', { request }),

  /**
   * 复制智能体
   */
  duplicateAgent: (agentId: string, name?: string): Promise<Agent> =>
    invokeApi('agents_duplicate', { agent_id: agentId, name }),

  /**
   * 启用/禁用智能体
   */
  toggleAgent: (agentId: string, isActive: boolean): Promise<Agent> =>
    invokeApi('agents_toggle', { agent_id: agentId, is_active: isActive }),

  /**
   * 获取智能体模板
   */
  getTemplates: (): Promise<AgentTemplate[]> =>
    invokeApi('agents_get_templates'),

  /**
   * 从模板创建智能体
   */
  createFromTemplate: (templateId: string, name: string): Promise<Agent> =>
    invokeApi('agents_create_from_template', { template_id: templateId, name }),

  /**
   * 获取智能体使用统计
   */
  getAgentStats: (agentId: string): Promise<{
    total_executions: number;
    total_tokens: number;
    avg_response_time: number;
    last_used_at?: number;
  }> =>
    invokeApi('agents_get_stats', { agent_id: agentId }),

  /**
   * 搜索智能体
   */
  searchAgents: (query: string): Promise<Agent[]> =>
    invokeApi('agents_search', { query }),

  /**
   * 导出智能体配置
   */
  exportAgent: (agentId: string): Promise<string> =>
    invokeApi('agents_export', { agent_id: agentId }),

  /**
   * 导入智能体配置
   */
  importAgent: (config: string): Promise<Agent> =>
    invokeApi('agents_import', { config }),
} as const;