// 智能体模块类型定义导出

// 重新导出 API 类型
export type {
  Agent,
  AgentParameters,
  CreateAgentRequest,
  UpdateAgentRequest,
  GetAgentsParams,
  ExecuteAgentRequest,
  ExecuteAgentResponse,
  AgentTemplate,
} from '../api/agentsApi';

import {
  Agent,
  AgentTemplate,
  CreateAgentRequest,
  AgentParameters,
  UpdateAgentRequest,
} from '../api/agentsApi';

import {
  AgentExecution,
  AgentStats,
  AgentFilters,
  AgentSortOptions,
} from '@/shared/stores/agents';

// 重新导出 Store 类型
export type {
  AgentExecution,
  AgentFilters,
  AgentSortOptions,
  AgentStats,
  AgentsStore,
} from '@/shared/stores/agents';

// UI 组件 Props 类型
export interface AgentCardProps {
  agent: Agent;
  onSelect?: (agent: Agent) => void;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agentId: string) => void;
  onDuplicate?: (agent: Agent) => void;
  onToggleActive?: (agentId: string, isActive: boolean) => void;
  showStats?: boolean;
  compact?: boolean;
}

export interface AgentListProps {
  agents?: Agent[];
  loading?: boolean;
  error?: string;
  viewMode?: 'grid' | 'list';
  onAgentSelect?: (agent: Agent) => void;
  onAgentEdit?: (agent: Agent) => void;
  onAgentDelete?: (agentId: string) => void;
  onAgentDuplicate?: (agent: Agent) => void;
  emptyMessage?: string;
  showCreateButton?: boolean;
  onCreateAgent?: () => void;
}

export interface AgentFormProps {
  agent?: Agent | null;
  template?: AgentTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAgentRequest | UpdateAgentRequest) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface AgentExecutorProps {
  agent: Agent;
  onExecute: (input: string, context?: Record<string, any>) => Promise<void>;
  onClear?: () => void;
  loading?: boolean;
  error?: string;
  executions?: AgentExecution[];
  maxHistoryItems?: number;
}

export interface TemplatePickerProps {
  templates?: AgentTemplate[];
  selectedTemplate?: AgentTemplate | null;
  onTemplateSelect: (template: AgentTemplate | null) => void;
  loading?: boolean;
  error?: string;
  compact?: boolean;
}

export interface AgentStatsProps {
  agentId: string;
  stats?: AgentStats;
  loading?: boolean;
  error?: string;
  showDetailedStats?: boolean;
  refreshInterval?: number;
}

export interface AgentSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface AgentFiltersProps {
  filters: AgentFilters;
  onFiltersChange: (filters: Partial<AgentFilters>) => void;
  onResetFilters: () => void;
  availableTags?: string[];
  availableUsers?: string[];
  compact?: boolean;
}

export interface AgentSortProps {
  sortOptions: AgentSortOptions;
  onSortChange: (options: AgentSortOptions) => void;
  compact?: boolean;
}

// 表单数据类型
export interface AgentFormData {
  name: string;
  description: string;
  avatar?: string;
  prompt: string;
  model: string;
  parameters: AgentParameters;
  capabilities: string[];
  tags: string[];
  is_public: boolean;
}

export interface AgentTemplateFormData {
  name: string;
  description: string;
  category: string;
  prompt: string;
  model: string;
  parameters: AgentParameters;
  capabilities: string[];
  tags: string[];
}

// 执行选项类型
export interface ExecutionOptions {
  stream?: boolean;
  context?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

// 智能体能力类型
export type AgentCapability =
  | 'text_generation'
  | 'code_generation'
  | 'data_analysis'
  | 'creative_writing'
  | 'research'
  | 'translation'
  | 'summarization'
  | 'qa'
  | 'chat'
  | 'tool_use';

// 智能体分类类型
export type AgentCategory =
  | 'assistant'
  | 'creative'
  | 'technical'
  | 'research'
  | 'business'
  | 'education'
  | 'entertainment'
  | 'utility';

// 模型选项类型
export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
  maxTokens: number;
  supportedFeatures: string[];
  pricing?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// 智能体导入/导出类型
export interface AgentExportData {
  version: string;
  agent: Omit<Agent, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
  metadata?: {
    exported_at: number;
    exported_by: string;
    application: string;
    version: string;
  };
}

export interface AgentImportResult {
  success: boolean;
  agent?: Agent;
  errors?: string[];
  warnings?: string[];
}

// 批量操作类型
export interface AgentBatchOperation {
  type: 'delete' | 'activate' | 'deactivate' | 'export' | 'update_tags';
  agentIds: string[];
  data?: any;
}

export interface AgentBatchResult {
  successful: string[];
  failed: Array<{
    agentId: string;
    error: string;
  }>;
}

// 智能体使用统计类型
export interface AgentUsageMetrics {
  daily: Array<{
    date: string;
    executions: number;
    tokens: number;
    avg_response_time: number;
  }>;
  weekly: Array<{
    week: string;
    executions: number;
    tokens: number;
    avg_response_time: number;
  }>;
  monthly: Array<{
    month: string;
    executions: number;
    tokens: number;
    avg_response_time: number;
  }>;
}

// 智能体对比类型
export interface AgentComparison {
  agents: Agent[];
  metrics: Array<{
    agentId: string;
    stats: AgentStats;
    performance: {
      accuracy?: number;
      speed: number;
      reliability: number;
    };
  }>;
}
