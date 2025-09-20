/**
 * 智能体管理相关的React Query Hooks
 */

import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { useApiMutation } from './useApiMutation';
import { useAuthStore } from '../../stores/auth';
import AgentsApi from '../../api/agents';
import type {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
} from '../../types/agent';

// 查询键常量
export const AGENT_QUERY_KEYS = {
  all: ['agents'] as const,
  list: () => [...AGENT_QUERY_KEYS.all, 'list'] as const,
  detail: (id: string) => [...AGENT_QUERY_KEYS.all, 'detail', id] as const,
  workHistory: (id: string) => [...AGENT_QUERY_KEYS.all, 'workHistory', id] as const,
  performance: (id: string) => [...AGENT_QUERY_KEYS.all, 'performance', id] as const,
};

/**
 * 获取智能体列表
 */
export function useAgents() {
  const { token } = useAuthStore();

  return useApiQuery(
    [...AGENT_QUERY_KEYS.list()],
    () => AgentsApi.getAgents(token!),
    {
      enabled: !!token,
      staleTime: 2 * 60 * 1000, // 2分钟内认为数据是新鲜的
    }
  );
}

/**
 * 获取智能体详情
 */
export function useAgent(agentId: string) {
  return useApiQuery(
    [...AGENT_QUERY_KEYS.detail(agentId)],
    () => AgentsApi.getAgent(agentId),
    {
      enabled: !!agentId,
      staleTime: 5 * 60 * 1000, // 5分钟内认为数据是新鲜的
    }
  );
}

/**
 * 获取智能体工作历史
 */
export function useAgentWorkHistory(agentId: string) {
  return useApiQuery(
    [...AGENT_QUERY_KEYS.workHistory(agentId)],
    () => AgentsApi.getAgentWorkHistory(agentId),
    {
      enabled: !!agentId,
      staleTime: 1 * 60 * 1000, // 1分钟内认为数据是新鲜的
    }
  );
}

/**
 * 获取智能体性能指标
 */
export function useAgentPerformanceMetrics(agentId: string) {
  return useApiQuery(
    [...AGENT_QUERY_KEYS.performance(agentId)],
    () => AgentsApi.getAgentPerformanceMetrics(agentId),
    {
      enabled: !!agentId,
      staleTime: 5 * 60 * 1000, // 5分钟内认为数据是新鲜的
    }
  );
}

/**
 * 创建智能体
 */
export function useCreateAgent() {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useApiMutation(
    (data: CreateAgentRequest) => AgentsApi.createAgent(data, token!),
    {
      onSuccess: (newAgent) => {
        // 更新智能体列表缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.list()], (oldData: Agent[] | undefined) => {
          return oldData ? [...oldData, newAgent] : [newAgent];
        });
        
        // 预设详情缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.detail(newAgent.agent_id)], newAgent);
      },
    }
  );
}

/**
 * 更新智能体
 */
export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useApiMutation(
    (data: UpdateAgentRequest) => AgentsApi.updateAgent(data),
    {
      onSuccess: (updatedAgent) => {
        // 更新智能体列表缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.list()], (oldData: Agent[] | undefined) => {
          return oldData?.map((agent) =>
            agent.agent_id === updatedAgent.agent_id ? updatedAgent : agent
          );
        });
        
        // 更新详情缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.detail(updatedAgent.agent_id)], updatedAgent);
      },
    }
  );
}

/**
 * 删除智能体
 */
export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useApiMutation(
    (agentId: string) => AgentsApi.deleteAgent(agentId),
    {
      onSuccess: (_, agentId) => {
        // 更新智能体列表缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.list()], (oldData: Agent[] | undefined) => {
          return oldData?.filter((agent) => agent.agent_id !== agentId);
        });
        
        // 移除相关缓存
        queryClient.removeQueries({ queryKey: [...AGENT_QUERY_KEYS.detail(agentId)] });
        queryClient.removeQueries({ queryKey: [...AGENT_QUERY_KEYS.workHistory(agentId)] });
        queryClient.removeQueries({ queryKey: [...AGENT_QUERY_KEYS.performance(agentId)] });
      },
    }
  );
}

/**
 * 更新智能体状态
 */
export function useUpdateAgentStatus() {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({ agentId, status }: { agentId: string; status: string }) =>
      AgentsApi.updateAgentStatus(agentId, status),
    {
      onSuccess: (updatedAgent) => {
        // 更新智能体列表缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.list()], (oldData: Agent[] | undefined) => {
          return oldData?.map((agent) =>
            agent.agent_id === updatedAgent.agent_id ? updatedAgent : agent
          );
        });
        
        // 更新详情缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.detail(updatedAgent.agent_id)], updatedAgent);
      },
    }
  );
}

/**
 * 启动智能体
 */
export function useStartAgent() {
  const queryClient = useQueryClient();

  return useApiMutation(
    (agentId: string) => AgentsApi.startAgent(agentId),
    {
      onSuccess: (updatedAgent) => {
        // 更新智能体列表缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.list()], (oldData: Agent[] | undefined) => {
          return oldData?.map((agent) =>
            agent.agent_id === updatedAgent.agent_id ? updatedAgent : agent
          );
        });
        
        // 更新详情缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.detail(updatedAgent.agent_id)], updatedAgent);
      },
    }
  );
}

/**
 * 停止智能体
 */
export function useStopAgent() {
  const queryClient = useQueryClient();

  return useApiMutation(
    (agentId: string) => AgentsApi.stopAgent(agentId),
    {
      onSuccess: (updatedAgent) => {
        // 更新智能体列表缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.list()], (oldData: Agent[] | undefined) => {
          return oldData?.map((agent) =>
            agent.agent_id === updatedAgent.agent_id ? updatedAgent : agent
          );
        });
        
        // 更新详情缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.detail(updatedAgent.agent_id)], updatedAgent);
      },
    }
  );
}

/**
 * 暂停智能体
 */
export function usePauseAgent() {
  const queryClient = useQueryClient();

  return useApiMutation(
    (agentId: string) => AgentsApi.pauseAgent(agentId),
    {
      onSuccess: (updatedAgent) => {
        // 更新智能体列表缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.list()], (oldData: Agent[] | undefined) => {
          return oldData?.map((agent) =>
            agent.agent_id === updatedAgent.agent_id ? updatedAgent : agent
          );
        });
        
        // 更新详情缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.detail(updatedAgent.agent_id)], updatedAgent);
      },
    }
  );
}

/**
 * 让智能体下线
 */
export function useOfflineAgent() {
  const queryClient = useQueryClient();

  return useApiMutation(
    (agentId: string) => AgentsApi.offlineAgent(agentId),
    {
      onSuccess: (updatedAgent) => {
        // 更新智能体列表缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.list()], (oldData: Agent[] | undefined) => {
          return oldData?.map((agent) =>
            agent.agent_id === updatedAgent.agent_id ? updatedAgent : agent
          );
        });
        
        // 更新详情缓存
        queryClient.setQueryData([...AGENT_QUERY_KEYS.detail(updatedAgent.agent_id)], updatedAgent);
      },
    }
  );
}